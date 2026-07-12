// Pure, framework-free calculation engine. Safe to import from both
// server (API routes) and client components.
//
// Core idea: every transaction moves `qty` from from_location to
// to_location. For a single challan's own ledger, the FIRST transaction's
// from_location is not debited — it represents pre-existing stock that
// existed before this challan was created for tracking. Every later leg
// debits/credits normally. This correctly handles arbitrary multi-hop,
// partial-quantity splits across any number of vendors.

export function sortByDateThenCreated(rows) {
  return rows.slice().sort((a, b) => {
    const da = (a.date || "") + (a.createdAt || a.id || "");
    const db_ = (b.date || "") + (b.createdAt || b.id || "");
    return da.localeCompare(db_);
  });
}

// A single challan can now carry multiple line items (parts) — like an e-way
// bill — entered together in one transaction. Each part's own qty must be
// tracked as its own independent ledger within that challan, otherwise
// quantities of different parts would get summed together as if fungible.
export function perChallanPartBalances(allTxns, challanNo) {
  const rows = sortByDateThenCreated(allTxns.filter((t) => t.challan === challanNo));
  const byPart = {};
  rows.forEach((t) => {
    (byPart[t.part] = byPart[t.part] || []).push(t);
  });
  return Object.keys(byPart)
    .sort()
    .map((part) => {
      const prows = byPart[part];
      const bal = {};
      prows.forEach((t, i) => {
        const qty = Number(t.qty) || 0;
        if (i === 0) {
          bal[t.to] = (bal[t.to] || 0) + qty;
        } else {
          bal[t.from] = (bal[t.from] || 0) - qty;
          bal[t.to] = (bal[t.to] || 0) + qty;
        }
      });
      const balances = Object.entries(bal)
        .filter(([, q]) => q > 0.001)
        .map(([location, qty]) => ({ location, qty }))
        .sort((a, b) => b.qty - a.qty);
      return { part, balances };
    });
}

// Backward-compatible view: combined balance per location across every part
// on the challan (used for a quick "where is everything right now" total).
export function perChallanBalances(allTxns, challanNo) {
  const bal = {};
  perChallanPartBalances(allTxns, challanNo).forEach(({ balances }) => {
    balances.forEach(({ location, qty }) => {
      bal[location] = (bal[location] || 0) + qty;
    });
  });
  return Object.entries(bal)
    .filter(([, qty]) => qty > 0.001)
    .map(([location, qty]) => ({ location, qty }))
    .sort((a, b) => b.qty - a.qty);
}

export function currentPositionRows(txns) {
  const byChallan = {};
  txns.forEach((t) => {
    (byChallan[t.challan] = byChallan[t.challan] || []).push(t);
  });
  const rows = [];
  Object.keys(byChallan).forEach((ch) => {
    const list = byChallan[ch];
    const sampleProject = list[0].project;
    const perPart = perChallanPartBalances(txns, ch);
    perPart.forEach(({ part, balances }) => {
      balances.forEach((b) => {
        rows.push({
          challan: ch,
          part,
          project: sampleProject,
          location: b.location,
          qty: b.qty,
          split: balances.length > 1
        });
      });
    });
  });
  return rows.sort(
    (a, b) => a.challan.localeCompare(b.challan) || a.part.localeCompare(b.part) || a.location.localeCompare(b.location)
  );
}

export function pendingAtVendorRows(txns) {
  return currentPositionRows(txns).filter((r) => r.location !== "Shivkripa");
}

export function inventoryByLocation(txns) {
  const map = {}; // location -> part -> gross qty (in - out)
  const rejectedMap = {}; // location -> part -> cumulative rejected qty RECEIVED there (never attributed to the sender)
  txns.forEach((t) => {
    const qty = Number(t.qty) || 0;
    map[t.to] = map[t.to] || {};
    map[t.to][t.part] = (map[t.to][t.part] || 0) + qty;
    map[t.from] = map[t.from] || {};
    map[t.from][t.part] = (map[t.from][t.part] || 0) - qty;

    if (t.movement === "RETURN" && Number(t.rejectedQty) > 0) {
      rejectedMap[t.to] = rejectedMap[t.to] || {};
      rejectedMap[t.to][t.part] = (rejectedMap[t.to][t.part] || 0) + Number(t.rejectedQty);
    }
  });

  const out = {};
  const allLocations = new Set([...Object.keys(map), ...Object.keys(rejectedMap)]);
  allLocations.forEach((loc) => {
    const goodParts = map[loc] || {};
    const rejParts = rejectedMap[loc] || {};
    const allParts = new Set([...Object.keys(goodParts), ...Object.keys(rejParts)]);
    const clean = {};
    let total = 0;
    allParts.forEach((p) => {
      const qty = goodParts[p] || 0;
      const rejected = rejParts[p] || 0;
      // Surface this part if there's stock OR a rejected balance to flag — a part that
      // fully cycled (dispatched then fully returned) can net to ~0 gross while still
      // having a real rejected quantity sitting at the receiving location.
      if (qty > 0.001 || rejected > 0.001) {
        const displayQty = Math.max(qty, 0);
        clean[p] = { qty: displayQty, rejected };
        total += displayQty;
      }
    });
    if (Object.keys(clean).length > 0) out[loc] = { parts: clean, total };
  });
  return out;
}

export function vendorPerformance(txns) {
  const vendors = {};
  txns.forEach((t) => {
    if (t.from !== "Shivkripa") vendors[t.from] = true;
    if (t.to !== "Shivkripa") vendors[t.to] = true;
  });
  return Object.keys(vendors)
    .sort()
    .map((v) => {
      const received = txns.filter((t) => t.to === v).reduce((s, t) => s + (Number(t.qty) || 0), 0);
      const returnedTxns = txns.filter((t) => t.from === v && t.movement === "RETURN");
      const returned = returnedTxns.reduce((s, t) => s + (Number(t.qty) || 0), 0);
      const rejected = returnedTxns.reduce((s, t) => s + (Number(t.rejectedQty) || 0), 0);
      const pct = returned > 0 ? (rejected / returned) * 100 : 0;
      const challans = new Set();
      txns.forEach((t) => {
        if (t.from === v || t.to === v) challans.add(t.challan);
      });
      return { vendor: v, received, returned, rejected, pct, challanCount: challans.size };
    });
}

export function computeKpis(txns) {
  const distinctChallans = new Set(txns.map((t) => t.challan));
  const pos = currentPositionRows(txns);
  const atVendorSet = new Set();
  const atHomeSet = new Set();
  pos.forEach((r) => {
    if (r.location === "Shivkripa") atHomeSet.add(r.challan);
    else atVendorSet.add(r.challan);
  });
  const rejected = txns
    .filter((t) => t.movement === "RETURN")
    .reduce((s, t) => s + (Number(t.rejectedQty) || 0), 0);
  return {
    total: distinctChallans.size,
    atVendor: atVendorSet.size,
    atHome: atHomeSet.size,
    rejected
  };
}
