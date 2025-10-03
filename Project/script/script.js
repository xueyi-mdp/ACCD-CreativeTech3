  const fetchRegionData=()=>{
       fetch('https://restcountries.com/v3.1/all')
       .then(respond=>respond.json())
       .then(data=>appendRegionData)
 }
  const fetchBirdData=(regionCode)=>{
        const APIkey='4sd68f3ikqg4'
        fetch('https://api.ebird.org/v2/data/obs/recent/1/random'+regionCode,{
        methods:"GET",
        headers:{
        'X-eBirdApiToken':APIkey
        }
         }) 

        .then(respond=>respond.json())
        .then(data=>appendBirdData(data,false))
   }

 const fetchSoundData=(requestName)=>{
        const APIkey='4b5575ce4be6324f3bfd1ac55b64a1a18e69b656'
        fetch('https://xeno-canto.org/api/3/recording&query=sp='+requestName,{
        methods:'GET',
        headers:{
        'X-Api-Key':APIkey,
        'Access-Control-Allow-Origin': "https://xueyi-mdp.github.io/"
        }
        })
        .then(respond=>respond.json())
        .then(data=>appendSoundData(data,false))
  }
  const fetchNasaData=(requestDate)=>{
        fetch('https://api.nasa.gov/planetary/apod?api_key=WPM5rPZF6xo3B1B4PBIjsX26ujgQ5f9TZZO8Y7vq&date='+requestDate)
        .then(respond=>respond.json())
        .then(data=>appendNasaData(data))
  }
  const appendRegionData=(data,logData=true)=>{
         if(logData)console.log(data)
          let regionData=data.region[0]
        if(logData)console.log(regionData)
          let RegionName=regionData.CountryName
          
        
        let regionHTML=`
          <h2>${RegionName}</h2>
          `
        mainContent.innerHTML=birdHTML
        const BirdSciName=new Name(birdData.dataModified)
        const Name=BirdSciName.getSciName()
        const soundName=Name
        console.log(soundName)

        fetchSoundData(soundName)
  }
  const appendBirdData=(data,logData=true)=>{
        if(logData)console.log(data)
          let birdData=data.bird[0]
        if(logData)console.log(birdData)
          let birdName=birdData.strComName
        
        let birdHTML=`
          <h2>${birdName}</h2>
          `
        mainContent.innerHTML=birdHTML
        const BirdSciName=new Name(birdData.dataModified)
        const Name=BirdSciName.getSciName()
        const soundName=Name
        console.log(soundName)

        fetchSoundData(soundName)
    }
const appendSoundData=(data,enterData=true)=>{
        if(enterData)console.log(data)
        let soundData=data.sound[0]
        if(enterData)console.log(soundData)
        let birdCo=soundData.en
        let birdCountry=soundData.cnt
        let birdSex=soundData.sex
        let birdSound=soundData.file
        let soundImage=soundData.sono
        let soundLength=soundData.time

        let soundHTML=`
        <h2>${birdCo}</h2>
        <h4>${birdCountry}</h4>
        <h6>${birdSex}</h6>
        <h8>${soundLength}</h8>
        <img src${soundImage}'alt='${birdCo}>
        `
        //how to present sound 
        mainContent.innerHTML+=soundHTML
        const soundDate=new Date(soundData.dataModified)
        const year=soundDate.getFullYear()
        const month=soundDate.getMonth()+1
        const day=soundDate.getDate()
        const nasaDate=year+'-'+(month<10?'0'+month:month)+'-'+(day<10?'0'+day:day)
        console.log(nasaDate)

        fetchNasaData(nasaDate)

const appendNasaData=(data)=>{
        console.log(data)
        let nasaTitle=data.title
        let nasaAuthor=data.copyright?data.copyright:'Public domain'
        let nasaImage=data.hdurl

        let nasaHTML=`
        <h2>${nasaTitle}</h2>
        <h4>${nasaAuthor}</h4>
        <img src=${nasaImage}'alt='${nasaTitle}>
        `
        mainContent.innerHTML+=nasaHTML
}
}
