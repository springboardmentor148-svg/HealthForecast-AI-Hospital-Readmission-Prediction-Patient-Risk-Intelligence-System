import "./Settings.css";

import {
    FaBell,
    FaLock,
    FaMoon,
    FaGlobe,
    FaDatabase,
    FaUserShield,
    FaSave
} from "react-icons/fa";

export default function Settings(){

    return(

        <div className="settingsPage">

            {/* Header */}

            <div className="settingsHeader">

                <div>

                    <h2>

                        Settings

                    </h2>

                    <p>

                        Configure your HealthForecast AI application.

                    </p>

                </div>

            </div>

            {/* Settings Grid */}

            <div className="settingsGrid">

                {/* Notifications */}

                <div className="settingCard">

                    <div className="settingTitle">

                        <FaBell/>

                        Notifications

                    </div>

                    <label>

                        <input type="checkbox" defaultChecked/>

                        Email Notifications

                    </label>

                    <label>

                        <input type="checkbox" defaultChecked/>

                        High Risk Alerts

                    </label>

                    <label>

                        <input type="checkbox"/>

                        Weekly Summary

                    </label>

                </div>

                {/* Appearance */}

                <div className="settingCard">

                    <div className="settingTitle">

                        <FaMoon/>

                        Appearance

                    </div>

                    <select>

                        <option>Light Theme</option>

                        <option>Dark Theme</option>

                    </select>

                </div>

                {/* Language */}

                <div className="settingCard">

                    <div className="settingTitle">

                        <FaGlobe/>

                        Language

                    </div>

                    <select>

                        <option>English</option>

                        <option>Hindi</option>

                    </select>

                </div>

                {/* Security */}

                <div className="settingCard">

                    <div className="settingTitle">

                        <FaLock/>

                        Security

                    </div>

                    <button>

                        Change Password

                    </button>

                </div>

                {/* AI Model */}

                <div className="settingCard">

                    <div className="settingTitle">

                        <FaDatabase/>

                        AI Model

                    </div>

                    <p>

                        Current Model

                    </p>

                    <strong>

                        XGBoost v1.0

                    </strong>

                </div>

                {/* Account */}

                <div className="settingCard">

                    <div className="settingTitle">

                        <FaUserShield/>

                        Account

                    </div>

                    <p>

                        Role

                    </p>

                    <strong>

                        Administrator

                    </strong>

                </div>

            </div>

            {/* Save */}

            <div className="saveArea">

                <button>

                    <FaSave/>

                    Save Changes

                </button>

            </div>

        </div>

    );

}