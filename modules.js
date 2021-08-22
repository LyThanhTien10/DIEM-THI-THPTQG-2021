const axios = require('axios');

module.exports = {
    createID: function(index){
        var cityID = new Array(3 - index.toString().length).join("0").toString() + index.toString();
        return cityID;
    },
    
    createSBD: function(cityID, Index){
        var Str = new Array(7 - Index.toString().length).join("0").toString() + Index.toString();

        var SBD = cityID + Str;
        return SBD;
    },

    sumMarks: function(x,y,z){
        if (x!="" && y!= "" && z!=""){
            return Math.round((parseFloat(x) + parseFloat(y) + parseFloat(z))*100)/100;
        }
        return '';
    }
}