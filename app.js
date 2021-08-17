const axios = require('axios');
const createSBD = require('./modules').createSBD;
const XLSX = require('xlsx');
const sumMark = require('./modules').sumMarks;
const workbook = XLSX.readFile('ĐIỂM THI THPTQG 2021.xlsx');
const SheetName = workbook.SheetNames[0];
const worksheet = XLSX.utils.sheet_to_json(workbook.Sheets[SheetName]);

async function loopReq(cityIndex, index, emptyLen, worksheet){
    if(emptyLen == 10){
        if (cityIndex <64){
            cityIndex++;
            index = 0;
            emptyLen = 0;
            loopReq(cityIndex, index, emptyLen, worksheet);
        }else{
            XLSX.utils.sheet_add_json(workbook.Sheets[SheetName], worksheet);
            XLSX.writeFile(workbook, "ĐIỂM THI THPTQG 2021.xlsx");
            return;
        }
    }

    var cityID = new Array(3 - cityIndex.toString().length).join("0").toString() + cityIndex.toString();
    var data = {
        code: createSBD(cityID, index+1),
        nam: 2021
    };

    await axios.get(`https://diemthi.vnanet.vn/Home/SearchBySobaodanh?code=${data.code}&nam=${data.nam}`)
        .then(function (response) {
            if (response.data.result[0] != undefined){
                let markData = response.data.result[0];
                let data = {
                    "SBD": markData.Code,
                    "Toán": markData.Toan,
                    "Lý": markData.VatLi,
                    "Hóa": markData.HoaHoc,
                    "Sinh": markData.SinhHoc,
                    "Ngoại ngữ": markData.NgoaiNgu,
                    "Ngữ văn": markData.NguVan,
                    "Sử": markData.LichSu,
                    "Địa": markData.DiaLi,
                    "GDCD": markData.GDCD,
                    "Khối A": sumMark(markData.Toan,markData.VatLi,markData.HoaHoc),
                    "Khối B": sumMark(markData.Toan,markData.HoaHoc,markData.SinhHoc),
                    "Khối A01": sumMark(markData.Toan,markData.VatLi,markData.NgoaiNgu),
                    "Khối C": sumMark(markData.NguVan,markData.LichSu,markData.DiaLi),
                    "Khối D": sumMark(markData.Toan,markData.NguVan,markData.NgoaiNgu)
                };
                worksheet.push(data);
                console.log(`Done request ${cityID}_${index}`);
                emptyLen = 0;
            }else{
                emptyLen++;
            };
            loopReq(cityIndex,index+1, emptyLen, worksheet);
        })
        .catch(function (error) {
            loopReq(cityIndex,index, emptyLen, worksheet);
            console.log(error);
        })
        .then(function () {
            // always executed
        });
}

let emptyLen = 0;
let index = 0;
let cityIndex = 1;
loopReq(cityIndex, index ,emptyLen, worksheet);