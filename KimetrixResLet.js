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
define(['N/record','N/search','N/url','N/https'], function(record,search,url,https) {
    function _post(context) {
        log.audit({title:'context',details:context});
        var peticion = context;
        /*
        *1 Clientes
        *2 Articulos
        *3 Listas de precio
        *4 Cuentas contables
        *5 Ubicaciones
        *6 Inicio ruta
        *7 Facturas por cobrar
        *8 Cierre de Ruta
        * */

        if(peticion.tipo == 1){

            var buscaCLientes = search.load({
                id: 'customsearch_busquedaclien_kimetrics'
            });

            var ejecutar_buscaCLientes= buscaCLientes.runPaged({
                pageSize: 1000
            });

            var thePageRanges = ejecutar_buscaCLientes.pageRanges;
            var objCliente = {};
            for (var i in thePageRanges){
                var thepageData = ejecutar_buscaCLientes.fetch({
                    index: thePageRanges[i].index
                });
                var indexx = thePageRanges[i].index;
                thepageData.data.forEach(function (result, indexx ) {
                    var objClienteDatos = {
                        "IDCliente":"",
                        "Cliente":"",
                        "Nombre":"",
                        "Terminos":"",
                        "LimiteCredito":"",
                        "Estatus":"",
                        "CategoriaID":"",
                        "Categoria":"",
                        "inactivo":"",
                        "hold":"",
                        "tipoServicioID": "",
                        "tipoServicio": ""
                    };

                    objClienteDatos.tipoServicioID = result.getValue({name:'custentity4'});
                    objClienteDatos.tipoServicio = result.getText({name:'custentity4'});
                    objClienteDatos.IDCliente = result.getValue({name:'internalid'});
                    objClienteDatos.hold = result.getValue({name:'credithold'});
                    objClienteDatos.Cliente = result.getValue({name:'entityid'});
                    objClienteDatos.Nombre = result.getValue({name:'altname'});
                    if(result.getValue({name:'terms'})=='10'){
                        objClienteDatos.Terminos = 1;//contado
                    }else{
                        objClienteDatos.Terminos = 0;//credito
                    }

                    var limitCredit = result.getValue({name:'creditlimit'});
                    if(limitCredit == '.00'){
                        objClienteDatos.LimiteCredito = '0';
                    }else{
                        objClienteDatos.LimiteCredito = result.getValue({name:'creditlimit'});
                    }

                    objClienteDatos.Estatus = result.getText({name:'entitystatus'});
                    objClienteDatos.CategoriaID = result.getValue({name:'category'});
                    objClienteDatos.Categoria = result.getText({name:'category'});
                    objClienteDatos.inactivo = result.getValue({name:'isinactive'});
                    objCliente[result.getValue({name:'internalid'})] = objClienteDatos;

                    return true;
                })
            }

                var respuesta = {
                    success: true,
                    ids:'Conexion exitosa',
                    data: objCliente
                };
            }

        if(peticion.tipo == 2){
            //Inicio catalogo
            var objItem = [];
            var ItemBusqueda = search.load({
                id: 'customsearch_articulos_kimetrics_2'
            });

            var myPagedResults = ItemBusqueda.runPaged({
                pageSize: 1000
            });

            var thePageRanges = myPagedResults.pageRanges;

            for (var i in thePageRanges) {

                var thepageData = myPagedResults.fetch({
                    index: thePageRanges[i].index
                });

                var indexx = thePageRanges[i].index;
                thepageData.data.forEach(function (result, indexx) {
                    var itemid = result.getValue({name: "internalid"});
                    var descrip = result.getValue({name: "salesdescription"});
                    var upscode = result.getValue({name: "upccode"});
                    var name = result.getValue({name: "displayname"});
                    var tipo = result.getText({name: "type"});
                    var Inactivo = result.getValue({name: "isinactive"});

                    objItem.push({
                        Articulo:itemid,
                        Descripcion:descrip,
                        UPSCode:upscode,
                        Nombre:name,
                        Tipo:tipo,
                        Inactivo:Inactivo
                    });
                    return true;
                })




            }

            var respuesta = {
                success: true,
                ids:'Conexion exitosa',
                data: objItem
            };
        }

        if(peticion.tipo == 3){

            var buscaListaPrecios = search.load({
                id: 'customsearch_price_list'
            });

            var ejecutar_buscaListaPrecios = buscaListaPrecios.run();

            var count =0;

            var objListaFinal = {};
            var searchResultCount = buscaListaPrecios.runPaged().count;

            var index = parseInt(searchResultCount /1000);
            var Temporal = 0;
            var Temporal2 = 999;
            for( A = 0 ;A <= index;A++){
                var resultado_buscaListaPrecios = ejecutar_buscaListaPrecios.getRange(Temporal, Temporal2);

                if (resultado_buscaListaPrecios.length > 0){

                    var objListaPrecios = {};
                    for (var i=0;i<resultado_buscaListaPrecios.length;i++){

                        var objListaPreciosDatos = {
                            "Cliente":"",
                            "Articulo":"",
                            "Precio":"",
                            "Moneda":"",
                            "inactivo":""
                        };

                        objListaPreciosDatos.Cliente = resultado_buscaListaPrecios[i].getValue({name: "internalid"});
                        objListaPreciosDatos.Articulo = resultado_buscaListaPrecios[i].getValue({name: "item", join: "pricing"});
                        objListaPreciosDatos.Precio = resultado_buscaListaPrecios[i].getValue({name: "unitprice", join: "pricing"});
                        objListaPreciosDatos.Moneda = resultado_buscaListaPrecios[i].getText({name: "currency", join: "pricing"});
                        objListaPreciosDatos.inactivo = resultado_buscaListaPrecios[i].getValue({name: "isinactive"});

                        objListaPrecios[count] = objListaPreciosDatos;
                        count ++;
                    }


                    if (resultado_buscaListaPrecios.length > 0){

                        var claves = Object.keys(objListaPrecios);
                        for (var i=0;i<resultado_buscaListaPrecios.length;i++){

                            var objFacDatos = {
                                "Cliente":"",
                                "Listas":{}
                            };

                            objFacDatos.Cliente = resultado_buscaListaPrecios[i].getValue({name: "internalid"});


                            for(var x=0; x< claves.length; x++){
                                if(objFacDatos.Cliente == objListaPrecios[claves[x]].Cliente ) {

                                    objFacDatos.Listas[x] =  objListaPrecios[claves[x]]

                                }

                            }

                            objListaFinal[resultado_buscaListaPrecios[i].getValue({name: 'internalid'})] = objFacDatos;


                        }



                    }


                    var respuesta = {
                        success: true,
                        ids:'Conexion exitosa',
                        data: objListaFinal
                    };


                }

                Temporal = Temporal + 1000
                Temporal2 = Temporal2 + 1000
            }


        }

        if(peticion.tipo == 4){
            var arrayMain = [];
            var mySearch = search.load({
                id: 'customsearch_cuentas_kimetrics'
            });

            var myPagedResults = mySearch.runPaged({
                pageSize: 1000
            });

            var thePageRanges = myPagedResults.pageRanges;

            for (var i in thePageRanges) {

                var thepageData = myPagedResults.fetch({
                    index: thePageRanges[i].index
                });

                var indexx = thePageRanges[i].index;
                thepageData.data.forEach(function (result, indexx) {
                    var ID = result.getText({name: "internalid"});
                    var Nombre = result.getValue({name: "name"});
                    var TipCuen = result.getValue({name: "type"});
                    var Inactivo = result.getValue({name: "isinactive"});

                    arrayMain.push({
                        ID:ID,
                        Nombre:Nombre,
                        TipCuen:TipCuen,
                        Inactivo:Inactivo
                    });
                    return true;
                })




            }
            var respuesta = {
                success: true,
                ids:'Conexion exitosa',
                data: arrayMain
            };

        }

        if(peticion.tipo == 5){


            var buscaUbicaciones = search.load({
                id: 'customsearch_ubicaciones_kimetrics'
            });

            var ejecutar_buscaUbicaciones = buscaUbicaciones.run();
            var resultado_buscaUbicaciones = ejecutar_buscaUbicaciones.getRange(0, 999);
            log.audit({title:'resultado_buscaUbicaciones',details:resultado_buscaUbicaciones});

            if (resultado_buscaUbicaciones.length > 0){
                var objUbicacion = {};

                for (var i=0;i<resultado_buscaUbicaciones.length;i++){

                    var objUbicacionDatos = {
                        "internalid":"",
                        "name":"",
                        "parent":"",
                        "plazaID":"",
                        "plaza":"",
                        "Inactivo":""
                    };

                    objUbicacionDatos.internalid = resultado_buscaUbicaciones[i].getValue({name: 'internalid'});
                    objUbicacionDatos.name = resultado_buscaUbicaciones[i].getValue({name: 'name'});
                    objUbicacionDatos.plazaID = resultado_buscaUbicaciones[i].getValue({name: 'cseg2'});
                    objUbicacionDatos.plaza = resultado_buscaUbicaciones[i].getText({name: 'cseg2'});
                    objUbicacionDatos.parent = resultado_buscaUbicaciones[i].getValue({name: 'namenohierarchy'});
                    objUbicacionDatos.Inactivo = resultado_buscaUbicaciones[i].getValue({name: 'isinactive'});


                    objUbicacion[resultado_buscaUbicaciones[i].getValue({name: 'internalid'})] = objUbicacionDatos;
                }

                var respuesta = {
                    success: true,
                    ids:'Conexion exitosa',
                    data: objUbicacion
                };
            }

        }

        if(peticion.tipo == 6){

            try {

                var Regtimb = record.create({
                    type: 'customrecord_tkio_reg_timbrado',
                    isDynamic: true,
                })

                var fecha = new Date()

                Regtimb.setValue({
                    fieldId: 'custrecord_tkio_fecha_proce_tr',
                    value: fecha
                })
                Regtimb.setValue({
                    fieldId: 'custrecord_tkio_procesado_tr',
                    value: false
                })
                Regtimb.setValue({
                    fieldId: 'custrecord_tkio_json_transaccion',
                    value: JSON.stringify(peticion)
                })
                var IDreg = Regtimb.save();

                if (IDreg){
                    var respuesta = {
                        success: true,
                        ids:'Conexion exitosa',
                        data: IDreg,

                    };
                }
            }catch (e) {

                var respuesta = {
                    success: true,
                    ids:'Conexion exitosa',
                    data: e.message,

                };
            }
        }


        if(peticion.tipo == 7){

            var buscaFacturasItems = search.load({
                id: 'customsearch_tkio_transaccion_item'
            });

            var ejecutar_buscaFacturasItems = buscaFacturasItems.run();
            var resultado_buscaFacturasItems = ejecutar_buscaFacturasItems.getRange(0, 999);
            var count =0;
            if (resultado_buscaFacturasItems.length > 0){
                var objFacturaItems = {};

                for (var i=0;i<resultado_buscaFacturasItems.length;i++){

                    var objFacItemsDatos = {
                        "IDfactura":"",
                        "Importe":"",
                        "Articulo":"",
                        "Cantidad":"",
                        "Estado": ""
                    };

                    objFacItemsDatos.IDfactura = resultado_buscaFacturasItems[i].getValue({name: 'internalid'});
                    objFacItemsDatos.Importe = resultado_buscaFacturasItems[i].getValue({name: 'amount'});
                    objFacItemsDatos.Articulo = resultado_buscaFacturasItems[i].getValue({name: 'item'});
                    objFacItemsDatos.Cantidad = resultado_buscaFacturasItems[i].getValue({name: 'quantity'});
                    objFacItemsDatos.Estado = resultado_buscaFacturasItems[i].getValue({name: 'Estado'});

                    objFacturaItems[count] = objFacItemsDatos;
                    count ++;
                }

                var buscaFacturas = search.load({
                    id: 'customsearch_tkio_transaccion'
                });

                var ejecutar_buscaFacturas = buscaFacturas.run();
                var resultado_buscaFacturas = ejecutar_buscaFacturas.getRange(0, 999);

                if (resultado_buscaFacturas.length > 0){
                    var objFactura = {};
                    var claves = Object.keys(objFacturaItems);
                    for (var i=0;i<resultado_buscaFacturas.length;i++){

                        var objFacDatos = {
                            "IDfactura":"",
                            "Cliente":"",
                            "Monto":"",
                            "FechaEmision":"",
                            "FechaVigencia":"",
                            "NumeroFac":"",
                            "Articulos":{}
                        };

                        var arrayMain = [];

                        objFacDatos.IDfactura = resultado_buscaFacturas[i].getValue({name: 'internalid'});
                        objFacDatos.Cliente = resultado_buscaFacturas[i].getValue({ name: "internalid", join: "customer"});
                        objFacDatos.Monto = resultado_buscaFacturas[i].getValue({name: 'total'});
                        objFacDatos.FechaEmision = resultado_buscaFacturas[i].getValue({name: 'trandate'});
                        objFacDatos.FechaVigencia = resultado_buscaFacturas[i].getValue({name: 'saleseffectivedate'});
                        objFacDatos.NumeroFac = resultado_buscaFacturas[i].getValue({name: 'invoicenum'});

                        for(var x=0; x< claves.length; x++){
                            if(objFacDatos.IDfactura == objFacturaItems[claves[x]].IDfactura ) {

                                objFacDatos.Articulos[x] =  objFacturaItems[claves[x]]




                            }
                        }

                        objFactura[resultado_buscaFacturas[i].getValue({name: 'internalid'})] = objFacDatos;
                    }
                }


                var respuesta = {
                    success: true,
                    ids:'Conexion exitosa',
                    data: objFactura
                };
            }
        }

        if(peticion.tipo == 8){
             var    array = peticion.campos;

            if (array){
                log.audit({title:'peticion[1',details: array[i]})
                var arrayResp=[];
                for(var i =0 ; i<array.length;i++){
                    var Regtimb = record.create({
                        type: 'customrecord_tkio_reg_timbrado',
                        isDynamic: true,
                    })

                    var fecha = new Date()

                    Regtimb.setValue({
                        fieldId: 'custrecord_tkio_fecha_proce_tr',
                        value: fecha
                    })
                    Regtimb.setValue({
                        fieldId: 'custrecord_tkio_procesado_tr',
                        value: false
                    })
                    Regtimb.setValue({
                        fieldId: 'custrecord_tkio_json_transaccion',
                        value: JSON.stringify(array[i])
                    })
                    var IDreg = Regtimb.save();

                    arrayResp.push(IDreg);

                }
                var respuesta = {
                    success: true,
                    ids:'Conexion exitosa',
                    data: arrayResp
                };
                log.audit({title:'arrayResp',details: arrayResp })
            }else{
                var Regtimb = record.create({
                    type: 'customrecord_tkio_reg_timbrado',
                    isDynamic: true,
                })

                var fecha = new Date()

                Regtimb.setValue({
                    fieldId: 'custrecord_tkio_fecha_proce_tr',
                    value: fecha
                })
                Regtimb.setValue({
                    fieldId: 'custrecord_tkio_procesado_tr',
                    value: false
                })
                Regtimb.setValue({
                    fieldId: 'custrecord_tkio_json_transaccion',
                    value: JSON.stringify(peticion)
                })
                var IDreg = Regtimb.save();

                log.audit({title:'IDreg',details: IDreg })

                var respuesta = {
                    success: true,
                    ids:'Conexion exitosa',
                    data: IDreg
                };
            }




        }


        if(peticion.tipo == 9){

            var arregloFull = [];

            var buscaCLientes = search.load({
                id: 'customsearch_busquedaclien_kimetrics'
            });

            var ejecutar_buscaCLientes= buscaCLientes.run();
            var resultado_buscaCLientes = ejecutar_buscaCLientes.getRange(0, 999);
            log.audit({title:'resultado_buscaCLientes',details:resultado_buscaCLientes});
            if(resultado_buscaCLientes.length > 0){

                var objCliente = {};
                for(var i=0;i<resultado_buscaCLientes.length;i++){

                    var objClienteDatos = {
                        "IDCliente":"",
                        "Cliente":"",
                        "Nombre":"",
                        "Terminos":"",
                        "LimiteCredito":"",
                        "Estatus":"",
                        "CategoriaID":"",
                        "Categoria":"",
                        "inactivo":""
                    };

                    objClienteDatos.IDCliente = resultado_buscaCLientes[i].getValue({name:'internalid'});
                    objClienteDatos.Cliente = resultado_buscaCLientes[i].getValue({name:'entityid'});
                    objClienteDatos.Nombre = resultado_buscaCLientes[i].getValue({name:'altname'});
                    if(resultado_buscaCLientes[i].getValue({name:'terms'})=='10'){
                        objClienteDatos.Terminos = 1;
                    }else{
                        objClienteDatos.Terminos = 0;
                    }

                    objClienteDatos.LimiteCredito = resultado_buscaCLientes[i].getValue({name:'creditlimit'});
                    objClienteDatos.Estatus = resultado_buscaCLientes[i].getText({name:'entitystatus'});
                    objClienteDatos.CategoriaID = resultado_buscaCLientes[i].getValue({name:'category'});
                    objClienteDatos.Categoria = resultado_buscaCLientes[i].getText({name:'category'});
                    objClienteDatos.inactivo = resultado_buscaCLientes[i].getValue({name:'isinactive'});
                    objCliente[resultado_buscaCLientes[i].getValue({name:'internalid'})] = objClienteDatos;
                }


            }

            var objItem = [];
            var ItemBusqueda = search.load({
                id: 'customsearch_articulos_kimetrics_2'
            });

            var myPagedResults = ItemBusqueda.runPaged({
                pageSize: 1000
            });

            var thePageRanges = myPagedResults.pageRanges;

            for (var i in thePageRanges) {

                var thepageData = myPagedResults.fetch({
                    index: thePageRanges[i].index
                });

                var indexx = thePageRanges[i].index;
                thepageData.data.forEach(function (result, indexx) {
                    var itemid = result.getValue({name: "internalid"});
                    var descrip = result.getValue({name: "salesdescription"});
                    var upscode = result.getValue({name: "upccode"});
                    var name = result.getValue({name: "displayname"});
                    var tipo = result.getText({name: "type"});

                    objItem.push({
                        Articulo:itemid,
                        Descripcion:descrip,
                        UPSCode:upscode,
                        Nombre:name,
                        tipo:tipo
                    });
                    return true;
                })




            }

            var arrayMain = [];
            var mySearch = search.load({
                id: 'customsearch_price_list'
            });

            var myPagedResults = mySearch.runPaged({
                pageSize: 1000
            });

            var thePageRanges = myPagedResults.pageRanges;

            for (var i in thePageRanges) {

                var thepageData = myPagedResults.fetch({
                    index: thePageRanges[i].index
                });

                var indexx = thePageRanges[i].index;
                thepageData.data.forEach(function (result, indexx) {
                    var NivelP = result.getText({name: "pricelevel", join: "pricing"});
                    var Userp = result.getValue({name: "internalid"});
                    var Pricep = result.getValue({name: "unitprice", join: "pricing"});
                    var ItemP = result.getValue({name: "item", join: "pricing"});
                    var CurrencyP = result.getText({name: "currency", join: "pricing"});

                    arrayMain.push({
                        Cliente:Userp,
                        NivelPrecio:NivelP,
                        Articulo:ItemP,
                        Precio:Pricep,
                        Moneda:CurrencyP
                    });
                    return true;
                })


            }


            var buscaUbicaciones = search.load({
                id: 'customsearch_ubicaciones_kimetrics'
            });

            var ejecutar_buscaUbicaciones = buscaUbicaciones.run();
            var resultado_buscaUbicaciones = ejecutar_buscaUbicaciones.getRange(0, 999);
            log.audit({title:'resultado_buscaUbicaciones',details:resultado_buscaUbicaciones});

            if (resultado_buscaUbicaciones.length > 0){
                var objUbicacion = {};

                for (var i=0;i<resultado_buscaUbicaciones.length;i++){

                    var objUbicacionDatos = {
                        "internalid":"",
                        "name":"",
                        "parent":""
                    };

                    objUbicacionDatos.internalid = resultado_buscaUbicaciones[i].getValue({name: 'internalid'});
                    objUbicacionDatos.name = resultado_buscaUbicaciones[i].getValue({name: 'name'});

                    objUbicacionDatos.parent = resultado_buscaUbicaciones[i].getValue({name: 'namenohierarchy'});


                    objUbicacion[resultado_buscaUbicaciones[i].getValue({name: 'internalid'})] = objUbicacionDatos;
                }

                var respuesta = {
                    success: true,
                    ids:'Conexion exitosa',
                    data: objUbicacion
                };
            }

            arregloFull.push(objCliente);
            var respuesta = {
                success: true,
                ids:'Conexion exitosa',
                data: arregloFull
            };
        }


        if(peticion.tipo == 10){

            var  ObjMain =[];

            /*var buscaZona = search.load({
                id: 'customsearch_zona_clientes'
            });

            var ejecutar_buscaZona= buscaZona.runPaged({
                pageSize: 1000
            });

            var thePageRanges = ejecutar_buscaZona.pageRanges;
            var objZona = {};
            for (var i in thePageRanges){
                var thepageData = ejecutar_buscaZona.fetch({
                    index: thePageRanges[i].index
                });
                var indexx = thePageRanges[i].index;
                thepageData.data.forEach(function (result, indexx ) {

                    var obZonaDatos = {
                        "Nombre":"",
                        "ID":""
                    };

                    obZonaDatos.ID = result.getValue({name:'internalid'});
                    obZonaDatos.Nombre = result.getValue({name:'name'});

                    objZona[result.getValue({name:'internalid'})] = obZonaDatos;

                    return true;
                })
                ObjMain.push(objZona)
            }*/
            var buscaEstado = search.load({
                id: 'customsearch_cliente_esatdo '
            });

            var ejecutar_buscaEstado= buscaEstado.runPaged({
                pageSize: 1000
            });

            var thePageRanges = ejecutar_buscaEstado.pageRanges;
            var objEstado = {};
            for (var i in thePageRanges){
                var thepageData = ejecutar_buscaEstado.fetch({
                    index: thePageRanges[i].index
                });
                var indexx = thePageRanges[i].index;
                thepageData.data.forEach(function (result, indexx ) {

                    var obEstadoDatos = {
                        "Nombre":"",
                        "ID":""
                    };

                    obEstadoDatos.ID = result.getValue({name:'internalid'});
                    obEstadoDatos.Nombre = result.getValue({name:'name'});

                    objEstado[result.getValue({name:'internalid'})] = obEstadoDatos;

                    return true;
                })
                ObjMain.push(objEstado)
            }

            var buscaCate = search.load({
                id: 'customsearch_listacategoria_cliente'
            });

            var ejecutar_buscaCate= buscaCate.runPaged({
                pageSize: 1000
            });

            var thePageRanges = ejecutar_buscaCate.pageRanges;
            var objCate = {};
            for (var i in thePageRanges){
                var thepageData = ejecutar_buscaCate.fetch({
                    index: thePageRanges[i].index
                });
                var indexx = thePageRanges[i].index;
                thepageData.data.forEach(function (result, indexx ) {

                    var obCateDatos = {
                        "Nombre":"",
                        "ID":""
                    };

                    obCateDatos.ID = result.getValue({name:'internalid'});
                    obCateDatos.Nombre = result.getValue({name:'name'});

                    objCate[result.getValue({name:'internalid'})] = obCateDatos;

                    return true;
                })
                ObjMain.push(objCate)
                ObjMain.push(objCate)
            }



            var buscaterminos = search.load({
                id: 'customsearch_terminos'
            });

            var ejecutar_buscaterminos= buscaterminos.runPaged({
                pageSize: 1000
            });

            var thePageRanges = ejecutar_buscaterminos.pageRanges;
            var objterminos = {};
            for (var i in thePageRanges){
                var thepageData = ejecutar_buscaterminos.fetch({
                    index: thePageRanges[i].index
                });
                var indexx = thePageRanges[i].index;
                thepageData.data.forEach(function (result, indexx ) {

                    var obterminosDatos = {
                        "Nombre":"",
                        "ID":""
                    };

                    obterminosDatos.ID = result.getValue({name:'internalid'});
                    obterminosDatos.Nombre = result.getValue({name:'name'});

                    objterminos[result.getValue({name:'internalid'})] = obterminosDatos;

                    return true;
                })
                ObjMain.push(objterminos)
            }
            var respuesta = {
                success: true,
                ids:'Conexion exitosa',
                data: ObjMain
            };


        }



        return respuesta;
    }



    return {
        post: _post,
    }
})