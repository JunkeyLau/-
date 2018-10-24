const weatherMap = {
  'sunny': '晴天',
  'cloudy': '多云',
  'lightrain': '小雨',
  'heavyrain': '大雨',
  'snow': '雪',
  'overcast': '多云'
}

const weatherColorMap = {
  'sunny': '#c4efff',
  'cloudy': '#daeff7',
  'overcast': '#c4ced2',
  'lightrain': '#b6d6e2',
  'heavyrain': '#c3ccd0',
  'snow': '#99e3ff'
}

const QQMapWX = require('/../../libs/qqmap-wx-jssdk.js')

const UNPROMPTED = 0
const UNAUTHORIZED = 1
const AUTHORIZED = 2

Page({
  data: {
    nowTemp: '',
    nowWeather: '',
    nowWeatherBackground: '',
    hourlyWeather: [],
    todayTemp: '',
    today: '',
    city: '成都市',
    locationAuthType: UNPROMPTED
  },
  onLoad() {
    this.qqmapsdk = new QQMapWX({
      key: 'SZNBZ-MKVKK-BSEJM-AJDGL-PJYLH-OUBPB'
    })
    wx.getSetting({
      success: res =>{
        let auth = res.authSetting['scope.userLocation']
        this.setData({
          locationAuthType : auth? AUTHORIZED:(auth===false)?UNAUTHORIZED:UNPROMPTED
        })

          if (auth)
            this.getCityAndWeather()
          else
           this.getNow()
      }
    })
    this.getNow()
  },
  onPullDownRefresh(){
    this.getNow(()=>{
      wx.stopPullDownRefresh()
    })
    console.log("刷新完成！")
  },
  getNow(callback){
    wx.request({
      url: 'https://test-miniprogram.com/api/weather/now', //调用优达学城天气API
      data: {city: this.data.city},
      success: res => {
        let result = res.data.result
        console.log(result)
        this.setNow(result)
        this.setHourlyWeather(result)
        this.setToday(result)
      },
      complete: ()=> {
        callback && callback()
      }
    })
  },
  setNow(result){
    let temp = result.now.temp
    let weather = result.now.weather
    console.log(temp, weather)
    this.setData({
      nowTemp: temp + '°',
      nowWeather: weatherMap[weather],
      nowWeatherBackground: '/images/' + weather + '-bg.png',
    })
    wx.setNavigationBarColor({
      frontColor: '#000000',
      backgroundColor: weatherColorMap[weather]
    })
  },
  setHourlyWeather(result){
    //设置预报变量
    let forecast = result.forecast
    let hourlyWeather = []
    let nowHour = new Date().getHours()
    //let nowHour = new Data().getHours(),注意！！！Date 和 Data
    for (let i = 0; i < 8; i += 1) {
      hourlyWeather.push({
        time: (i * 3 + nowHour) % 24 + '时',
        iconPath: '/images/' + forecast[i].weather + '-icon.png',
        temp: forecast[i].temp + '°'
      })
    }
    hourlyWeather[0].time = '现在'
    this.setData({
      hourlyWeather: hourlyWeather
    })
  },
  //设置今日数据，注意如何设置显示多个变量
  setToday(result){
    let date = new Date()
    this.setData({
      todayTemp: `${result.today.minTemp}° 至 ${result.today.maxTemp}°`,
      todayDate: `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()} 今天`
    })
  },
  onTapDayWeather(){
    wx.showToast({
      title: '加载中',
      icon: 'loading',
      duration: 1500
    })
    wx.navigateTo({
      url: '/pages/list/list?city='+ this.data.city,
    })
  },
  onTapLocation() {
    if (this.data.locationAuthType === UNAUTHORIZED)
     wx.openSetting({
       success: res=>{
         let auth = res.authSetting['scope.userLocation']
         if (auth) {
           this.getCityAndWeather()
         }
       }
     })
    else
      this.getCityAndWeather()
  },
   getCityAndWeather(){
    wx.getLocation({
      success: res => {
        this.setData({
          locationAuthType: AUTHORIZED,
        })
        this.qqmapsdk.reverseGeocoder({
          location: {
            latitude: res.latitude,
            longitude: res.longitude
          },
          success: res => {
            let city = res.result.address_component.city
            console.log(city)
            this.setData({
              city: city,
              locationTips: ''
            })
          }
        })
      },
      fail: () => {
        this.setData({
          locationAuthType: UNAUTHORIZED,
        })
      }
    })
  },
  onShareAppMessage: function (res) {
    if (res.from === 'button') {
      // 来自页面内转发按钮
      console.log(res.target)
    }
    return {
      title: '七日天气',
      path: '/pages/index/index'
    }
  },
})
