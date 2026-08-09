import "./DashboardCard.css";

function DashboardCard({

    title,

    value,

    change,

    icon,

    color

}) {

    return (

        <div className="dashboardCard">

            <div className="cardTop">

                <div
                    className="iconBox"
                    style={{ background: color }}
                >

                    {icon}

                </div>

                <span className="change">

                    {change}

                </span>

            </div>

            <div className="cardBody">

                <p>

                    {title}

                </p>

                <h2>

                    {value}

                </h2>

            </div>

            <div className="cardFooter">

                Last updated 2 mins ago

            </div>

        </div>

    );

}

export default DashboardCard;