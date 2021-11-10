/**
 *@NApiVersion 2.x
 *@NScriptType Restlet
 *@Author        Carlos Botello
 *@Created       10-11-2021
 *@ScriptName    Main_kimetrix_connection
 *@Filename      Main_kimetrix_connection.js
 *@ScriptID
 *@modifications
 *  Date          Author            Version     Remarks
 *  0000-00-00    Author               1         Edit
 *
 */
define(['N/record','N/search'], function(record,search) {
    function _post(context) {
        log.audit({title:'context',details:context});
        var peticion = context;
        /*
        *1 Clientes
        *2 Articulos
        *
        *
        *
        *
        * */
        if(peticion.tipo == 1){
            var buscaCLientes = search.create({
                type: search.Type.CUSTOMER,
                filters:[
                    ['internalid',search.Operator.ANYOF,2067,2320]
                ],
                columns:[
                    search.createColumn({name:'internalid'}),
                    search.createColumn({name:'companyname'}),
                ]
            });
            var ejecutar_buscaCLientes= buscaCLientes.run();
            var resultado_buscaCLientes = ejecutar_buscaCLientes.getRange(0, 100);
            if(resultado_buscaCLientes.length > 0){


                var objCliente = {};
                for(var i=0;i<resultado_buscaCLientes.length;i++){

                    var objClienteDatos = {
                        "internalid":"",
                        "companyname":""
                    };
                    objClienteDatos.internalid = resultado_buscaCLientes[i].getValue({name:'internalid'});
                    objClienteDatos.companyname = resultado_buscaCLientes[i].getValue({name:'companyname'});

                    objCliente[resultado_buscaCLientes[i].getValue({name:'internalid'})] = objClienteDatos;
                }

                var respuesta = {
                    success: true,
                    ids:'Conexion exitosa',
                    data: objCliente
                };
            }
        }




        return respuesta;
    }



    return {
        post: _post,
    }
});
