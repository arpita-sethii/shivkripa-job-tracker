const STYLES = {
  DISPATCH: "text-steel bg-steel-bg",
  TRANSFER: "text-ochre bg-ochre-bg",
  RETURN: "text-forest bg-[#e4eee6]"
};

export default function Stamp({ movement }) {
  return <span className={`stamp ${STYLES[movement] || ""}`}>{movement}</span>;
}
