import { useState, useEffect } from "react";
import { getProfile, updateProfile } from "../services/authService";

function getInitials(name) {
    if (!name) return "DR";
    const parts = name.trim().split(" ");
    const initials = parts.slice(0, 2).map((p) => p[0]?.toUpperCase());
    return initials.join("") || "DR";
}

function Profile() {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [isEditing, setIsEditing] = useState(false);
    const [fullName, setFullName] = useState("");
    const [saving, setSaving] = useState(false);
    const [saveMessage, setSaveMessage] = useState("");

    const fetchProfile = async () => {
        try {
            const data = await getProfile();
            setProfile(data);
            setFullName(data.full_name);
        } catch (err) {
            setError("Failed to load profile. Please log in again.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProfile();
    }, []);

    const handleEditClick = () => {
        setFullName(profile.full_name);
        setSaveMessage("");
        setIsEditing(true);
    };

    const handleCancel = () => {
        setFullName(profile.full_name);
        setIsEditing(false);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        setSaveMessage("");

        try {
            const updated = await updateProfile({ full_name: fullName });
            setProfile(updated);

            const storedUser = JSON.parse(localStorage.getItem("user"));
            localStorage.setItem(
                "user",
                JSON.stringify({ ...storedUser, full_name: updated.full_name })
            );

            setIsEditing(false);
            setSaveMessage("Profile updated successfully.");
        } catch (err) {
            setSaveMessage("Failed to update profile. Please try again.");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <div className="text-center py-5 text-muted">Loading profile...</div>;
    }

    if (error) {
        return <div className="alert alert-danger">{error}</div>;
    }

    return (
        <div>
            {/* Gradient cover banner with avatar */}
            <div
                style={{
                    background: "linear-gradient(135deg, #4a7bd9 0%, #2fa66b 100%)",
                    borderRadius: "14px",
                    height: "110px",
                    position: "relative",
                }}
            >

                <div
                    className="d-flex align-items-center justify-content-center text-white fw-bold shadow"
                    style={{
                        width: "90px",
                        height: "90px",
                        borderRadius: "50%",
                        background: "linear-gradient(135deg, #2c3e50, #4a7bd9)",
                        fontSize: "1.6rem",
                        position: "absolute",
                        bottom: "-30px",
                        left: "30px",
                        border: "4px solid #ffffff",
                    }}
                >
                    {getInitials(profile.full_name)}
                </div>
            </div>

            <div style={{ marginLeft: "140px", marginTop: "10px" }}>
                <h4 className="mb-0">{profile.full_name}</h4>
                <span className="badge bg-primary-subtle text-primary-emphasis">
                    {profile.role}
                </span>
            </div>

            <hr className="mt-4" />

            {/* Profile details / edit form */}
            <div className="row">
                <div className="col-md-6">

                    <div className="d-flex justify-content-between align-items-center mb-3">
                        <h5 className="mb-0">Account Details</h5>
                        {!isEditing && (
                            <button
                                className="btn btn-outline-primary btn-sm"
                                onClick={handleEditClick}
                            >
                                Edit
                            </button>
                        )}
                    </div>

                    {saveMessage && (
                        <div
                            className={`alert ${
                                saveMessage.includes("successfully")
                                    ? "alert-success"
                                    : "alert-danger"
                            }`}
                        >
                            {saveMessage}
                        </div>
                    )}

                    {!isEditing ? (
                        <>
                            <div className="mb-3">
                                <label className="form-label fw-bold">Full Name</label>
                                <p className="form-control-plaintext">
                                    {profile.full_name}
                                </p>
                            </div>

                            <div className="mb-3">
                                <label className="form-label fw-bold">Email</label>
                                <p className="form-control-plaintext">
                                    {profile.email}
                                </p>
                            </div>

                            <div className="mb-3">
                                <label className="form-label fw-bold">Role</label>
                                <p className="form-control-plaintext">
                                    {profile.role}
                                </p>
                            </div>
                        </>
                    ) : (
                        <form onSubmit={handleSave}>
                            <div className="mb-3">
                                <label className="form-label fw-bold">Full Name</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="mb-3">
                                <label className="form-label fw-bold">Email</label>
                                <p className="form-control-plaintext text-muted">
                                    {profile.email}
                                    <span className="badge bg-light text-dark ms-2">
                                        Not editable
                                    </span>
                                </p>
                            </div>

                            <div className="mb-3">
                                <label className="form-label fw-bold">Role</label>
                                <p className="form-control-plaintext">
                                    {profile.role}
                                </p>
                            </div>

                            <div className="d-flex gap-2">
                                <button
                                    type="submit"
                                    className="btn btn-primary flex-fill"
                                    disabled={saving}
                                >
                                    {saving ? "Saving..." : "Save Changes"}
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-secondary flex-fill"
                                    onClick={handleCancel}
                                    disabled={saving}
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}

export default Profile;