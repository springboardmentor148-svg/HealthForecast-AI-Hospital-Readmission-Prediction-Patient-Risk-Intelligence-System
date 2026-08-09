import "../../assets/css/topbar.css";

import {
    FaSearch,
    FaBell,
    FaMoon,
    FaChevronDown
} from "react-icons/fa";

function Topbar() {

    return (

        <header className="topbar">

            <div className="topbarLeft">

                <h2>Dashboard</h2>

                <p>
                    Hospital Readmission Prediction System
                </p>

            </div>

            <div className="topbarRight">

                <div className="searchBox">

                    <FaSearch className="searchIcon"/>

                    <input
                        type="text"
                        placeholder="Search patients..."
                    />

                </div>

                <button className="topIcon">

                    <FaMoon/>

                </button>

                <button className="topIcon notification">

                    <FaBell/>

                    <span className="notify"></span>

                </button>

                <div className="profile">

                    <img
                        src="https://i.pravatar.cc/100?img=12"
                        alt="profile"
                    />

                    <div>

                        <h5>

                            Dr. Rahul

                        </h5>

                        <span>

                            Administrator

                        </span>

                    </div>

                    <FaChevronDown/>

                </div>

            </div>

        </header>

    );

}

export default Topbar;