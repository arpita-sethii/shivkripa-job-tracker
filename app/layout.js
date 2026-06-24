import "./globals.css";

export const metadata = {
  title: "Shivkripa Job Work Tracker",
  description: "Track material movement between Shivkripa and job-work vendors"
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
