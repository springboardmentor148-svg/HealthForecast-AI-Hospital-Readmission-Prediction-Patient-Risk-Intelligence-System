import "./Profile.css";

import { useEffect, useState } from "react";

import { toast } from "react-hot-toast";

import authService from "../../services/authService";

import {

    FaUserMd,

    FaHospital,

    FaEnvelope,

    FaPhone,

    FaMapMarkerAlt,

    FaCalendarAlt,

    FaShieldAlt,

    FaRobot,

    FaEdit

} from "react-icons/fa";

export default function Profile() {

    const [loading, setLoading] = useState(true);

    const [user, setUser] = useState({

        id: "",

        name: "",

        email: "",

        role: ""

    });

    useEffect(() => {

        loadProfile();

    }, []);

    const loadProfile = async () => {

        try {

            const response = await authService.getCurrentUser();

            setUser(response.data);

        }

        catch (error) {

            console.log(error);

            toast.error("Unable to load profile.");

        }

        finally {

            setLoading(false);

        }

    };

    if (loading) {

        return (

            <div className="text-center mt-5">

                <h3>

                    Loading Profile...

                </h3>

            </div>

        );

    }

    return (

        <div className="profilePage">

            {/* Header */}

            <div className="profileHeader">

                <div>

                    <h2>

                        User Profile

                    </h2>

                    <p>

                        Manage your professional information.

                    </p>

                </div>

                <button className="editProfile">

                    <FaEdit />

                    Edit Profile

                </button>

            </div>

            {/* Profile */}

            <div className="profileGrid">

                <div className="profileCard">

                    <img

                        src="https://i.pravatar.cc/200?img=12"

                        alt="profile"

                    />

                    <h3>

                        {user.name}

                    </h3>

                    <span>

                        {user.role}

                    </span>

                    <div className="badge">

                        {user.role}

                    </div>

                </div>

                <div className="detailsCard">

                    <h3>

                        Personal Information

                    </h3>

                    <div className="detail">

                        <FaEnvelope/>

                        <span>

                            {user.email}

                        </span>

                    </div>

                    <div className="detail">

                        <FaUserMd/>

                        <span>

                            User ID : {user.id}

                        </span>

                    </div>

                    <div className="detail">

                        <FaShieldAlt/>

                        <span>

                            Role : {user.role}

                        </span>

                    </div>

                    <div className="detail">

                        <FaHospital/>

                        <span>

                            HealthForecast AI

                        </span>

                    </div>

                    <div className="detail">

                        <FaCalendarAlt/>

                        <span>

                            Active User

                        </span>

                    </div>

                </div>

            </div>

            {/* AI Information */}

            <div className="aiCard">

                <h3>

                    AI System Information

                </h3>

                <div className="aiGrid">

                    <div>

                        <FaRobot/>

                        <h4>

                            Model

                        </h4>

                        <p>

                            XGBoost Classifier

                        </p>

                    </div>

                    <div>

                        <FaShieldAlt/>

                        <h4>

                            Accuracy

                        </h4>

                        <p>

                            96.8%

                        </p>

                    </div>

                    <div>

                        <FaUserMd/>

                        <h4>

                            Logged In As

                        </h4>

                        <p>

                            {user.role}

                        </p>

                    </div>

                </div>

            </div>

        </div>

    );

}