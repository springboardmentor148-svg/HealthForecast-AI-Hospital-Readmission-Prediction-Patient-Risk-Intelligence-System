import {

ResponsiveContainer,

LineChart,

Line,

CartesianGrid,

XAxis,

YAxis,

Tooltip

} from "recharts";

const data=[

{month:"Jan",value:12},

{month:"Feb",value:20},

{month:"Mar",value:17},

{month:"Apr",value:28},

{month:"May",value:22},

{month:"Jun",value:35}

];

function ReadmissionChart(){

return(

<div className="card p-4 shadow rounded-4">

<h5>

Monthly Readmissions

</h5>

<ResponsiveContainer

width="100%"

height={300}

>

<LineChart

data={data}

>

<CartesianGrid strokeDasharray="3 3"/>

<XAxis dataKey="month"/>

<YAxis/>

<Tooltip/>

<Line

type="monotone"

dataKey="value"

stroke="#2563EB"

strokeWidth={4}

/>

</LineChart>

</ResponsiveContainer>

</div>

);

}

export default ReadmissionChart;