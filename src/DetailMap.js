import React, { Component } from 'react';
import { Map as LeafletMap, GeoJSON, Marker, Popup } from 'react-leaflet';
import worldGeoJSON from 'geojson-world-map';
import './styles.css';
import countryCode from './countrycode-latlong';
import "leaflet/dist/leaflet.css";
import { ChevronDown } from 'react-feather';
import { BrowserRouter as Router, Switch, Route, Link } from "react-router-dom";
import moment from "moment";
import L from "leaflet";
import Chart from './Chart';

// SVG to URL

const customMarker = (ratio, rgb) => new L.icon({
  iconUrl: "data:image/svg+xml,%3Csvg width='50' height='50' viewBox='0 0 50 50' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='25' cy='25' r='24' fill='%23" + rgb + "' fill-opacity='0.6' stroke='%23" + rgb + "' stroke-width='2'/%3E%3C/svg%3E%0A",
  iconSize: 5 * ratio,
  iconAnchor: [2.5 * ratio, 2.5 * ratio],
});

const axios = require('axios');

class App extends Component {
  constructor() {
    super();
    this.handleChange = this.handleChange.bind(this);
    this.state = {
      selected: "cases",
      data: [],
      dataTotal: [],
      center: [0, 0],
      zoom: 3,
      countryHistoryData: [],
      isFetchingCharts: false
    };
  }

  handleChange(event) {
    this.setState({ selected: event.target.value });
  }

  getData() {
    // Cases by country
    axios.get("https://coronavirus-monitor.p.rapidapi.com/coronavirus/cases_by_country.php", {
      "headers": {
        "x-rapidapi-host": "coronavirus-monitor.p.rapidapi.com",
        "x-rapidapi-key": "1f3a79bf36mshfa6df8cd380f68ap172d31jsnb28f04990b8d"
      }
    })
      .then(response => {
        this.setState({
          data: response.data.countries_stat
        })
      })
      .catch(err => {
        console.log(err);
      });

    // Stats panel
    axios.get("https://coronavirus-monitor.p.rapidapi.com/coronavirus/worldstat.php", {
      "headers": {
        "x-rapidapi-host": "coronavirus-monitor.p.rapidapi.com",
        "x-rapidapi-key": "1f3a79bf36mshfa6df8cd380f68ap172d31jsnb28f04990b8d"
      }
    })
      .then(response => {
        this.setState({
          dataTotal: response.data,
        })
      })
      .catch(err => {
        console.log(err);
      });
  }

  componentDidMount() {
    this.getData();
  }

  countryChart(country, countryCode) {
    if (countryCode && countryCode.country_code)
      countryCode = countryCode.country_code;

    this.setState({ isFetchingCharts: true }, () => {
      axios.get("https://coronavirus-monitor.p.rapidapi.com/coronavirus/cases_by_particular_country.php", {
        "headers": {
          "x-rapidapi-host": "coronavirus-monitor.p.rapidapi.com",
          "x-rapidapi-key": "1f3a79bf36mshfa6df8cd380f68ap172d31jsnb28f04990b8d"
        },
        params: {
          country: country
        }
      })
      .then(response => {
          let lastDate = moment().add(1, 'days');
          let records = [];
  
          for (let i = 0; i < response.data.stat_by_country.length; i++) {
            let record = response.data.stat_by_country[i];
            if (moment(record.record_date).diff(lastDate, 'days') < 0) {
              lastDate = moment(record.record_date);
              records.push(record);
              if (records.length >= 30)
                break;
            }
          }
          axios.get("https://covid19-api.org/api/prediction/" + countryCode).then(res => {
            res = res.data;
            let lastItem = records[records.length - 1];
            const newCoef = parseInt(lastItem.total_cases.replaceAll(',', '')) /  parseInt(lastItem.active_cases.replaceAll(',', ''));
            const deathCoef =  parseInt(lastItem.total_cases.replaceAll(',', '')) /  parseInt(lastItem.total_deaths.replaceAll(',', '')) ;
            const recoveredCoef =  parseInt(lastItem.total_cases.replaceAll(',', '')) / parseInt(lastItem.total_recovered.replaceAll(',', ''));

            console.log(res);
            // debugger
            for (let i = 0; i < res.length; i++) {
              records.unshift({
                record_date: res[i].date,
                active_cases: String(Math.floor(parseInt(res[i].cases) / newCoef)),
                total_deaths: String(Math.floor(parseInt(res[i].cases) / deathCoef)),
                total_recovered: String(Math.floor(parseInt(res[i].cases) / recoveredCoef)),
              })
            }

            console.log(records)
            
            this.setState({isFetchingCharts: false, countryHistoryData: records.reverse()})
          }).catch(err => {
            console.log(err);
            this.setState({ isFetchingCharts: false })
          })
          
      })
      .catch(err => {
        console.log(err);
        this.setState({ isFetchingCharts: false })
      });
    })
    
  }
  clearChart() {
    this.setState({ countryHistoryData: [] });
  }

  render() {
    return (
      <div>
        <LeafletMap
          center={[0, 0]}
          zoom={3}
          maxZoom={5}
          attributionControl={true}
          zoomControl={true}
          doubleClickZoom={true}
          scrollWheelZoom={true}
          dragging={true}
          animate={true}
          easeLinearity={0.35}
          style={{
            height: "100vh",
            backgroundColor: "#01011a"
          }}
        >
          <GeoJSON
            data={worldGeoJSON}
            style={() => ({
              weight: 0.5,
              color: "#292929",
              fillColor: "rgb(65, 65, 65)",
              fillOpacity: 1,
            })}
          />
          {this.state.data.map((value, index) => {
            let cases = value.cases.replace(/,/g, "");
            let recovered = value.total_recovered.replace(/,/g, "");
            let active = value.active_cases.replace(/,/g, "");
            let deaths = value.deaths.replace(/,/g, "");
            var cases_ratio = 0;
            var rgb = "";
            if (this.state.selected === "cases") {
              cases_ratio = Math.pow(cases, 0.2);
              rgb = "a9002a";
            }
            else if (this.state.selected === "active") {
              cases_ratio = Math.pow(active, 0.2);
              rgb = "ffc107";
            }
            else if (this.state.selected === "recovered") {
              cases_ratio = Math.pow(recovered, 0.2);
              rgb = "28a745";
            }
            else {
              cases_ratio = Math.pow(deaths, 0.2);
              rgb = "9c9c9c";
            }
            return (
              (countryCode.find((el) => el.name === value.country_name)) ?
                (<Marker key={index} position={
                  countryCode.find((el) => el.name === value.country_name) &&
                  countryCode.find((el) => el.name === value.country_name).latlng
                } icon={customMarker(cases_ratio, rgb)} onclick={() => {
                    console.log()
                    this.countryChart(value.country_name, countryCode.find((el) => el.name === value.country_name))
                }}>
                  <Popup className={'popup'} style={{ backgroundColor: "black" }}>
                    <h1>{value.country_name}</h1>
                    <p><b>Cases: </b> <span style={{ color: '#A90000' }}>{value.cases}</span></p>
                    <p><b>New cases: </b> <span style={{ color: '#A90000' }}>{value.new_cases}</span></p>
                    <p><b>Recovered: </b> <span style={{ color: '#28a745' }}>{value.total_recovered}</span></p>
                    <p><b>Active: </b> <span style={{ color: '#ffc107' }}>{value.active_cases}</span></p>
                    <p><b>Deaths: </b> {value.deaths}</p>
                    <p><b>New deaths: </b> {value.new_deaths}</p>
                    <p><b>Critical: </b> {value.serious_critical}</p>
                    <p><b>Per 1m: </b>{value.total_cases_per_1m_population}</p>
                  </Popup>
                </Marker>) :
                (null)
            )
          })
          }
        </LeafletMap>
        <div id="attributions">
          &copy; <a href="http://osm.org/copyright">OpenStreetMap</a> контрибутор |
          Данні з <a href="https://coronavirus-monitor.p.rapidapi.com/">rapidapi</a>
        </div>
        <div className="info-box" id="choices_desktop">
          <ul>
            <li className={this.state.selected === "cases" ? "active" : undefined} onClick={() => { this.setState({ selected: "cases" }) }}>
              Випадки
            </li>
            <li className={this.state.selected === "active" ? "active" : undefined} onClick={() => { this.setState({ selected: "active" }) }}>
              Активні
            </li>
            <li className={this.state.selected === "recovered" ? "active" : undefined} onClick={() => { this.setState({ selected: "recovered" }) }}>
              Одужали
            </li>
            <li className={this.state.selected === "deaths" ? "active" : undefined} onClick={() => { this.setState({ selected: "deaths" }) }}>
              Померли
            </li>
          </ul>
        </div>
        <div className="info-box" id="total">
          <p><b>Загалом випадків </b><span style={{ color: '#A90000' }}>{this.state.dataTotal.total_cases}</span></p>
          <p><b>Нові випадки </b><span style={{ color: '#A90000' }}>{this.state.dataTotal.new_cases}</span></p>
          <p><b>Загалом одужали </b><span style={{ color: '#28a745' }}>{this.state.dataTotal.total_recovered}</span></p>
          <p><b>Загалом вмерли </b><span>{this.state.dataTotal.total_deaths}</span></p>
          <p><b>Нові померлі </b><span>{this.state.dataTotal.new_deaths}</span></p>
          <div className="select">
            <div id="select">
              <select value={this.state.selected} name="select" onChange={this.handleChange}>
                <option value="cases">Випадки</option>
                <option value="active">Активні</option>
                <option value="recovered">Одужали</option>
                <option value="deaths">Померли</option>
              </select>
              <ChevronDown size={"18px"} />
            </div>
          </div>
        </div>
        <div id="gh">
          <p>
            <Link to="/">
              <img src="https://image.flaticon.com/icons/png/512/2/2144.png" />
            </Link>
          </p>
        </div>
          <Chart stat={this.state.countryHistoryData} isFetching={this.state.isFetchingCharts} closeCliked={() => {this.clearChart()}}/>
      </div >
    );
  }
}

export default App;