import React from 'react'
import moment from "moment";
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  } from 'recharts';


export default (props) => {
    let stat = props.stat;
    let data = [];

    stat.forEach(record => {
        data.push({
            name: moment(record.record_date).format("DD/MM"),
            active: parseInt(record.active_cases.replaceAll(',', '')),
            deaths: parseInt(record.total_deaths.replaceAll(',', '')),
            newCases: parseInt(record.total_recovered.replaceAll(',', ''))
        })
    });

    console.log(props.isFetching);

    return (
        <div className="chart-box" style={{opacity: data.length || props.isFetching ? 1 : 0}}>
            { props.isFetching && !data.length ? (<a>Loading...</a>)  : (<LineChart
                width={600}
                height={300}
                data={data}

                margin={{
                    top: 5, right: 30, left: 20, bottom: 5,
                }}
                >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="active" stroke="#8884d8" name="Хворих"/>
                <Line type="monotone" dataKey="deaths" stroke="red" name="Померли" />
                <Line type="monotone" dataKey="newCases" stroke="#82ca9d" name="Одужали" />
            </LineChart>) }
            { !props.isFetching ? (<a class="close-btn" onClick={props.closeCliked}>Закрити</a>) : ("") }
        </div>
    );
}