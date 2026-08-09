import Sidebar from "../components/Sidebar/Sidebar";

import Navbar from "../components/Navbar/Navbar";

import { Outlet } from "react-router-dom";

function DashboardLayout(){

return(

<>

<Sidebar/>

<div style={{marginLeft:"270px"}}>

<Navbar/>

<div style={{

padding:"30px",

background:"#F4F7FE",

minHeight:"calc(100vh - 90px)"

}}>

<Outlet/>

</div>

</div>

</>

);

}

export default DashboardLayout;