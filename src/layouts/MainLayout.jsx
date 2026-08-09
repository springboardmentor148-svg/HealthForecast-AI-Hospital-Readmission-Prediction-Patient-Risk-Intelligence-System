import Sidebar from "../components/Layout/Sidebar";
import Topbar from "../components/Layout/Topbar";
import { Outlet } from "react-router-dom";

export default function MainLayout() {

    return (

        <div style={{display:"flex"}}>


            <Sidebar/>

            <div style={{marginLeft:"270px", width:"100%"}}>

                <Topbar/>

                <Outlet/>

            </div>

        </div>

    );

}