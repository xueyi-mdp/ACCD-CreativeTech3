  const fetchFishData=()=>{
        
        fetch('https://www.webapps.nwfsc.noaa.gov/observersalmon/api/v1/data/observer/selection.json',{
          methods:'GET', 
          headers:'Access-Control-Allow-Origin'
        })
    
        .then(respond=>respond.json())
        .then(data=>{
          const fishData=data.fish[0]
          console.log(data)
          let fishName=data.strFish
          let fishImage=data.strFishThumb
          let fishHTML=`
          <h2>${fishName}</h2>
          <img src="${fishImage}"alt="${fishName}">
          `
       
        mainContent.innerHTML=fishHTML
        })
    }