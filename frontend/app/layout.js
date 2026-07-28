export const metadata = {
  title: "HealthForecast AI",
  description: "AI-Based Diabetic Patient Readmission Prediction System",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}