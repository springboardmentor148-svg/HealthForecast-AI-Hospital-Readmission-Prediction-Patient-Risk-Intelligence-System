function Footer() {
    return (
        <footer className="text-center text-muted small py-4 no-print">
            <p className="mb-1 fw-medium">HealthForecast AI · Version 1.0</p>
            <p className="mb-1">Powered by FastAPI + React + XGBoost</p>
            <p className="mb-0">© {new Date().getFullYear()} HealthForecast AI</p>
        </footer>
    );
}

export default Footer;