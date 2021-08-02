const axios = require('axios');

module.exports = {
    createSBD: function(Index){
        var cityID = "550";
        var Str = new Array(6 - Index.toString().length).join("0").toString() + Index.toString();

        var SBD = cityID + Str;
        return SBD;
    },

    sumMarks: function(x,y,z){
        if (x!="" && y!= "" && z!=""){
            return parseFloat(x) + parseFloat(y) + parseFloat(z);
        }
        return '';
    }
}