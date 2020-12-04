import React, { useState } from 'react'
import moment from "moment";
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  } from 'recharts';
import ReactSwitch from 'react-switch';


export default (props) => {
    let stat = props.stat;
    let data = [];

    const [isPred, setPred] = useState(false)

    stat.forEach(record => {
        data.push({
            name: moment(record.record_date).format("DD/MM"),
            active: parseInt(record.active_cases.replaceAll(',', '')),
            deaths: parseInt(record.total_deaths.replaceAll(',', '')),
            newCases: parseInt(record.total_recovered.replaceAll(',', ''))
        })
    });

    const readyData = isPred ? data : data.slice(0, 30);

    console.log(props.isFetching);

    return (
        <div className="chart-box" style={{opacity: readyData.length || props.isFetching ? 1 : 0}}>
            <p align="center">{props.country}, <ReactSwitch offColor="#000" checked={isPred} onChange={(val) => setPred(val)}></ReactSwitch>Прогноз  </p>
            { props.isFetching && !readyData.length ? (<a>Loading...</a>)  : (<LineChart
                width={600}
                height={300}
                data={readyData}

                margin={{
                    top: 5, right: 30, left: 20, bottom: 5,
                }}
                >
                <CartesianGrid strokeDasharray="4 " />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="active" stroke="#8884d8" name="Хворих"/>
                <Line type="monotone" dataKey="deaths" stroke="red" name="Померли" />
                <Line type="monotone" dataKey="newCases" stroke="#82ca9d" name="Одужали" />
            </LineChart>) }
            { !props.isFetching ? (<a class="close-btn" onClick={props.closeCliked}>Закрити</a>) : ("") }
            <br/>
            
        </div>
    );
}