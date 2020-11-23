import React, { Component } from 'react';
import './styles.css';
import { ChevronDown } from 'react-feather';
import { BrowserRouter as Router, Switch, Route, Link } from "react-router-dom";
import DetailMap from "./DetailMap";
const axios = require('axios');

class App extends Component {
  constructor() {
    super();
    this.handleChange = this.handleChange.bind(this);
    this.state = {
      dataTotal: [],
    };
  }

  handleChange(event) {
    this.setState({ selected: event.target.value });
  }

  getData() {
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

  render() {
    return (
      <Router>
        
        <Switch>
        <Route path="/map">
            <DetailMap />
          </Route>
          <Route path="/">
          <div>
          <div id="mainpage-full">
            <div id="world-img">
              
            </div>
          </div>
          <div className="info-box" id="total">
          <Link id="select-country" to="/map">Відкрити карту</Link>
            <p><b>Загалом випадків </b><span style={{ color: '#A90000' }}>{this.state.dataTotal.total_cases}</span></p>
            <p><b>Нові випадки </b><span style={{ color: '#A90000' }}>{this.state.dataTotal.new_cases}</span></p>
            <p><b>Загалом одужали </b><span style={{ color: '#28a745' }}>{this.state.dataTotal.total_recovered}</span></p>
            <p><b>Загалом вмерли </b><span>{this.state.dataTotal.total_deaths}</span></p>
            <p><b>Нові померлі </b><span>{this.state.dataTotal.new_deaths}</span></p>
          </div>
        </div >
          </Route>
        </Switch>
      </Router>
    );
  }
}

export default App;