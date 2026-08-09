import "./Navbar.css";

import {

FaSearch,
FaBell,
FaUserCircle

} from "react-icons/fa";

function Navbar(){

return(

<div className="navbar">

<div>

<h2>

HealthForecast AI

</h2>

<p>

Hospital Readmission Prediction System

</p>

</div>

<div className="right">

<div className="search">

<FaSearch/>

<input

placeholder="Search patient..."

type="text"

/>

</div>

<div className="notification">

<FaBell/>

<span>

3

</span>

</div>

<div className="profile">

<FaUserCircle/>

<div>

<h6>

Rahul Sharma

</h6>

<p>

Doctor

</p>

</div>

</div>

</div>

</div>

);

}

export default Navbar;