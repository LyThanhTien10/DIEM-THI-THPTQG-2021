const axios = require('axios');
const Excel = require('exceljs');
const sumMark = require('./modules').sumMarks;

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


var cityId = Array.from({length:64},(_,index) => index + 1);
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
        const batches = createBatch(idArr,5000);
        await (async function(){
            for (const batch of batches){
                try {
                    await Promise.all(batch.map(async(item) =>{
                        const url = `https://diemthi.vnanet.vn/Home/SearchBySobaodanh?code=${item[1]}&nam=2021`;
                        const getFunc = item[0];
                        const result = await getFunc(url).then(result =>{
                            if(result!=undefined){
                                return {
                                    "SBD": result.Code,
                                    "Toán": result.Toan,
                                    "Lý": result.VatLi,
                                    "Hóa": result.HoaHoc,
                                    "Sinh": result.SinhHoc,
                                    "Ngoại ngữ": result.NgoaiNgu,
                                    "Ngữ văn": result.NguVan,
                                    "Sử": result.LichSu,
                                    "Địa": result.DiaLi,
                                    "GDCD": result.GDCD,
                                    "Khối A": sumMark(result.Toan,result.VatLi,result.HoaHoc),
                                    "Khối B": sumMark(result.Toan,result.HoaHoc,result.SinhHoc),
                                    "Khối A01": sumMark(result.Toan,result.VatLi,result.NgoaiNgu),
                                    "Khối C": sumMark(result.NguVan,result.LichSu,result.DiaLi),
                                    "Khối D": sumMark(result.Toan,result.NguVan,result.NgoaiNgu)
                                };
                            }
                            return undefined;
                        });
                        delete url;
                        delete getFunc;
                        if (result!=undefined){
                            database.push(result);
                        }
                        console.log(item[1]);
                    }));
                  } catch(err) {
                    console.error(err)
                  }
            }
        })();
        return database;
    })
    .then(database =>{
        const options = {
            filename: 'DIEM.xlsx',
            useStyles: true,
            useSharedStrings: true
          };
           
        const workbook = new Excel.stream.xlsx.WorkbookWriter(options);
        
        const worksheet = workbook.addWorksheet('my sheet');
        
        worksheet.columns = [
            { header: 'SBD', key: 'SBD' },
            { header: 'Toán', key: 'Toán' },
            { header: 'Lý', key: 'Lý' },
            { header: 'Hóa', key: 'Hóa' },
            { header: 'Sinh', key: 'Sinh' },
            { header: 'Ngoại ngữ', key: 'Ngoại ngữ' },
            { header: 'Ngữ văn', key: 'Ngữ văn' },
            { header: 'Sử', key: 'Sử' },
            { header: 'Địa', key: 'Địa' },
            { header: 'Khối A', key: 'Khối A' },
            { header: 'Khối B', key: 'Khối B' },
            { header: 'Khối A01', key: 'Khối A01' },
            { header: 'Khối C', key: 'Khối C' },
            { header: 'Khối D', key: 'Khối D' },
        ];

        for (let i=0;i<database.length;i++){
            worksheet.addRow(database[i]).commit();
        }

        workbook.commit().then(function() {
            console.log('excel file created');
        });
    });