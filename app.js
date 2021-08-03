const axios = require('axios');
const createSBD = require('./modules').createSBD;
const XLSX = require('xlsx');
const sumMark = require('./modules').sumMarks;
const workbook = XLSX.readFile('Can Tho.xlsx');
const SheetName = workbook.SheetNames[0];
const worksheet = XLSX.utils.sheet_to_json(workbook.Sheets[SheetName]);

async function loopReq(index, emptyLen, worksheet){
    if(emptyLen == 10){
        XLSX.utils.sheet_add_json(workbook.Sheets[SheetName], worksheet);
        XLSX.writeFile(workbook, "Can Tho.xlsx");
        return;
    }
    var data = {
        code: createSBD(index+1),
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
                    "Khối B": sumMark(markData.Toan,markData.HoaHoc,markData.SinhHoc)
                };
                worksheet.push(data);
                console.log(`Done request: ${index}`);

                emptyLen = 0;
            }else{
                emptyLen++;
            };
            console.log(emptyLen);
            loopReq(index+1, emptyLen, worksheet);
        })
        .catch(function (error) {
            loopReq(index, emptyLen, worksheet);
            console.log(error);
        })
        .then(function () {
            // always executed
        });
}

let emptyLen = 0;
loopReq(0,emptyLen, worksheet);