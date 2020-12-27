import * as Realm from "realm-web";
import moment from "moment";
const axios = require('axios');
const app = new Realm.App({ id: "coronamap-lnbfh" });

const credentials = Realm.Credentials.apiKey("hQqmH1F7NHfOtvIFLA6y9RS80CBwVGmnY9r5WMXIah2TF1Z9L5LmC6LzacgbOrFG");
class StatsManager {
    constructor() {
        this.lastData = null;
        this.user = null;
    }

    async initUser() {
        if (!this.user) {
            try {
                // Authenticate the user
                const user = await app.logIn(credentials);
                // `App.currentUser` updates to match the logged in user
                //   assert(user.id === app.currentUser.id)
                console.log(user)
                this.user = user;
            } catch (err) {
                console.error("Failed to log in", err);
            }
        }
    }

    async getTodayCountry(countryName, countryCode) {
        if (countryCode.country_code)
            countryCode = countryCode.country_code;
        const newActiveInfo = this.user.mongoClient("mongodb-atlas").db("stats").collection("active_new_cases");
        const recoveredInfo = this.user.mongoClient("mongodb-atlas").db("stats").collection("recovered");
        const newAndCommonDeathsInfo = this.user.mongoClient("mongodb-atlas").db("stats").collection("new_and_common_deaths");
        const predInfo = this.user.mongoClient("mongodb-atlas").db("stats").collection("prediction");
        
        let data = await this.getCountryData_API(countryName, countryCode);
        let dataToSave = data.slice(14, data.length);
        let predData = data.slice(0, 14);

        console.log(dataToSave)
        console.log(predData)

        for (let i = 0; i < dataToSave.length; i++) {
            let item = data[i];
            let todayNewActiveData = await newActiveInfo.findOne({ record_date: moment(item.record_date).format("DD/MM/YYYY"), country_name: item.country_name });
            if (!todayNewActiveData) {
                console.log("adding to DB")
                let doc = { ...item, record_date: moment(item.record_date).format("DD/MM/YYYY")  }
                await newActiveInfo.insertOne({ active_cases: doc.active_cases, new_cases: doc.new_cases, record_date: doc.record_date, country_name: doc.country_name });
                await recoveredInfo.insertOne({ recovered: doc.total_recovered, record_date: doc.record_date, country_name: doc.country_name });
                await newAndCommonDeathsInfo.insertOne({ new_deaths: doc.new_deaths, total_deaths: doc.total_deaths, record_date: doc.record_date, country_name: doc.country_name  });
            }
        }

        let todayRecord = await predInfo.findOne({ record_date: moment().format("DD/MM/YYYY"), country_code: countryCode });
        if (!todayRecord) {
            console.log("adding pred to db")
            predInfo.insertOne({ predData, record_date: moment().format("DD/MM/YYYY"), country_code: countryCode  })
        }

        return data.reverse();
    }

    async getTodayGlobal() {
        const mainInfo = this.user.mongoClient("mongodb-atlas").db("stats").collection("main_info");
        // debugger
        let todayData = await mainInfo.findOne({ statistic_taken_at: moment().format("DD/MM/YYYY") });
        if (todayData) {
            console.log("db..."); return todayData;
        }
        else {
            console.log("not db...")
            let data = await this.getGlobalData_API();
            await mainInfo.insertOne({ ...data, statistic_taken_at: moment(data.statistic_taken_at).format("DD/MM/YYYY") });
            return data;
        }
    }

    loadActiveAndNewSickness = (date, countryCode) => {

    }

    async getGlobalData_API() {
        return new Promise((res, rej) => {
            // Stats panel
            axios.get("https://coronavirus-monitor.p.rapidapi.com/coronavirus/worldstat.php", {
                "headers": {
                    "x-rapidapi-host": "coronavirus-monitor.p.rapidapi.com",
                    "x-rapidapi-key": "1f3a79bf36mshfa6df8cd380f68ap172d31jsnb28f04990b8d"
                }
            })
                .then(response => {
                    res(response.data)
                })
                .catch(err => {
                    console.log(err);
                    rej(err);
                });
        })
    }

    async getCountryData_API(countryName, countryCode) {
        return new Promise((resolve, rej) => {
            axios.get("https://coronavirus-monitor.p.rapidapi.com/coronavirus/cases_by_particular_country.php", {
                "headers": {
                    "x-rapidapi-host": "coronavirus-monitor.p.rapidapi.com",
                    "x-rapidapi-key": "1f3a79bf36mshfa6df8cd380f68ap172d31jsnb28f04990b8d"
                },
                params: {
                    country: countryName
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
                        const newCoef = parseInt(lastItem.total_cases.replaceAll(',', '')) / parseInt(lastItem.active_cases.replaceAll(',', ''));
                        const deathCoef = parseInt(lastItem.total_cases.replaceAll(',', '')) / parseInt(lastItem.total_deaths.replaceAll(',', ''));
                        const recoveredCoef = parseInt(lastItem.total_cases.replaceAll(',', '')) / parseInt(lastItem.total_recovered.replaceAll(',', ''));

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

                        console.log(records.reverse())
                        resolve(records.reverse())

                    }).catch(err => {
                        console.log(err);
                        rej(err);
                    })

                })
                .catch(err => {
                    console.log(err);
                    rej(err)
                });
        })
    }
}

export default StatsManager;