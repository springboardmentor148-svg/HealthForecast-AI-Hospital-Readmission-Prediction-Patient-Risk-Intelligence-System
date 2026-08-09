import {

PieChart,

Pie,

ResponsiveContainer,

Cell,

Tooltip

} from "recharts";

const data=[

{

name:"High",

value:40

},

{

name:"Medium",

value:30

},

{

name:"Low",

value:30

}

];

const colors=[

"#EF4444",

"#F59E0B",

"#22C55E"

];

function RiskChart(){

return(

<div className="card p-4 shadow rounded-4">

<h5>

Risk Distribution

</h5>

<ResponsiveContainer

width="100%"

height={300}

>

<PieChart>

<Pie

data={data}

dataKey="value"

outerRadius={100}

>

{

data.map((entry,index)=>(

<Cell

key={index}

fill={colors[index]}

/>

))

}

</Pie>

<Tooltip/>

</PieChart>

</ResponsiveContainer>

</div>

);

}

export default RiskChart;
