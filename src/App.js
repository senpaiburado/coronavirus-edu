import React, { Component } from 'react';
import './styles.css';
import { ChevronDown } from 'react-feather';
import { BrowserRouter as Router, Switch, Route, Link } from "react-router-dom";
import DetailMap from "./DetailMap";
import StatsManager from "./StatsManager";
const axios = require('axios');

class App extends Component {
  constructor() {
    super();
    this.handleChange = this.handleChange.bind(this);
    this.manager = new StatsManager;
    this.state = {
      dataTotal: [],
    };
  }

  handleChange(event) {
    this.setState({ selected: event.target.value });
  }

  async getData() {
    await this.manager.initUser();
    // Stats panel
    this.manager.getTodayGlobal()
      .then(response => {
        this.setState({
          dataTotal: response,
        })
      })
      .catch(err => {
        console.log(err);
      });
  }

  async componentDidMount() {
    await this.getData();
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
            <p><b>Загалом померли </b><span>{this.state.dataTotal.total_deaths}</span></p>
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