function Spinner({ text = "Loading..." }) {
    return (
        <div className="d-flex align-items-center justify-content-center gap-2 py-4 text-muted">
            <div className="spinner-border spinner-border-sm" role="status">
                <span className="visually-hidden">Loading</span>
            </div>
            <span>{text}</span>
        </div>
    );
}

export default Spinner;