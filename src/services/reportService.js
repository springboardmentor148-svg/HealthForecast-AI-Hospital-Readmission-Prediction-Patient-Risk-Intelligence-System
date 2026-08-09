import api from "./api";

const reportService={

getReports(){

return api.get("/reports");

},

downloadPDF(id){

return api.get(`/reports/${id}/pdf`,{

responseType:"blob"

});

},

downloadExcel(){

return api.get("/reports/excel",{

responseType:"blob"

});

}

};

export default reportService;