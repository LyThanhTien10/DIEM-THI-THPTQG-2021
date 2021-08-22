const axios = require('axios');
const XLSX = require('xlsx');
const sumMark = require('./modules').sumMarks;
const fs = require('fs');
const workbook = XLSX.readFile('ĐIỂM THI THPTQG 2021.xlsx');
const SheetName = workbook.SheetNames[0];
const worksheet = XLSX.utils.sheet_to_json(workbook.Sheets[SheetName]);

//Function to find stop id of each city
const findStop = async (min, max, id)=>{
    let mid = parseInt((max+min)/2);
    if ((min-max)**2 == 1){
        return min;
    } 

    var sbd1 = createSBD(mid);
    var sbd2 = createSBD(mid+1);
    var result1 = await getData(sbd1).then((result) =>{return result});
    var result2 = await getData(sbd2).then((result) =>{return result});

    if(result1 == false && result2 == false){
        max = mid;
        return await findStop(min,max).then(result =>{return result});
    }else{
        min = mid;
        return await findStop(min,max).then(result =>{return result});
    }
}

// Function to fetch Github info of a user.
const getMark = async (url) => {
    console.log(`Fetching ${url}`);
    const resData = await axios(url) ;
    // API call to get user info from Github.
    return resData.data.result[0];
}

//Function to get data
const getData= async (id)=>{
    var url = `https://diemthi.vnanet.vn/Home/SearchBySobaodanh?code=${id}&nam=2021`;
    const resData = await axios(url) ;
    var check = await resData.data.result[0] != undefined ? true : false;
    return check; 
}

const createSBD = (index)=>{
    var ID = new Array(9 - index.toString().length).join("0").toString() + index.toString();
    return ID;
}; 

const createBatch = function (array, size) {
    var results = [];
    while (array.length) {
        const batch = array.splice(0,size).map((item)=>{
            return [getMark,item];
        });
        results.push(batch);
    }
    return results;
};

const getCapacity = async (arr)=>{
    const requests = arr.map((item)=>{
        let min = item*1000000 + 0;
        let max = item*1000000 + 999999;
        return findStop(min,max,item).then(result =>{return result});
    });
    return Promise.all(requests);
}


var cityId = Array.from({length:1},(_,index) => index + 1);
getCapacity(cityId)
    .then(async(result) => {
        const capacity = await result;
        console.log(capacity);
        return capacity;
    })
    .then(capacity =>{
        var idArr = [];
        for (let i=0;i<capacity.length;i++){
            idArr = idArr.concat(Array.from({length: capacity[i]%1000000}, (_,index)=> createSBD((i+1)*1000000 + index + 1)));
        }
        console.log(idArr);
        return idArr;
    })
    .then(async(idArr)=>{
        var database = [];
        const batches = createBatch(idArr,500);
        await (async function(){
            for (const batch of batches){
                try {
                    await Promise.all(batch.map(async(item) =>{
                        const url = `https://diemthi.vnanet.vn/Home/SearchBySobaodanh?code=${item[1]}&nam=2021`;
                        const getFunc = item[0];
                        const result = await getFunc(url).then(result =>{
                            return result;
                        });
                        await database.push(result);
                        delete url;
                        delete getFunc;
                        delete result;
                        console.log(item[1]);
                    }));
                  } catch(err) {
                    console.error(err)
                  }
            }
        })();
        return database;
    })
    .then(async(databases) =>{
        await databases.map((database)=>{
            let data = {
                "SBD": database[i].Code,
                "Toán": database[i].Toan,
                "Lý": database[i].VatLi,
                "Hóa": database[i].HoaHoc,
                "Sinh": database[i].SinhHoc,
                "Ngoại ngữ": database[i].NgoaiNgu,
                "Ngữ văn": database[i].NguVan,
                "Sử": database[i].LichSu,
                "Địa": database[i].DiaLi,
                "GDCD": database[i].GDCD,
                "Khối A": sumMark(database[i].Toan,database[i].VatLi,database[i].HoaHoc),
                "Khối B": sumMark(database[i].Toan,database[i].HoaHoc,database[i].SinhHoc),
                "Khối A01": sumMark(database[i].Toan,database[i].VatLi,database[i].NgoaiNgu),
                "Khối C": sumMark(database[i].NguVan,database[i].LichSu,database[i].DiaLi),
                "Khối D": sumMark(database[i].Toan,database[i].NguVan,database[i].NgoaiNgu)
            };
            worksheet.push(data);
            delete data;
        });
        XLSX.utils.sheet_add_json(workbook.Sheets[SheetName], worksheet);
        XLSX.writeFile(workbook, "ĐIỂM THI THPTQG 2021.xlsx");
    });