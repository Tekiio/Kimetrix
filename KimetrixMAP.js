/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 */
define(['N/error','N/record','N/runtime', 'N/search','N/format','N/url','N/https'],
    /**
     * @param {email} email
     * @param {error} error
     * @param {record} record
     * @param {runtime} runtime
     * @param {search} searchaa
     */
    function(error, record, runtime, search, format,url,https)
    {

        /**
         * Map/Reduce Script:
         * Sample Map/Reduce script for blog post.
         */


        /**
         * Marks the beginning of the Map/Reduce process and generates input data.
         *
         * @typedef {Object} ObjectRef
         * @property {number} id - Internal ID of the record instance
         * @property {string} type - Record type id
         *
         * @return {Array|Object|Search|RecordRef} inputSummary
         * @since 2015.1
         */
        function getInputData()
        {
            try{
                var customrecord_tkio_reg_timbradoSearchObj = search.create({
                    type: "customrecord_tkio_reg_timbrado",
                    filters:
                        [
                            ["custrecord_tkio_procesado_tr","is","F"]
                        ],
                    columns:
                        [
                            search.createColumn({name: "custrecord_tkio_details_error", label: "Detalle"}),
                            search.createColumn({name: "custrecord_tkio_fecha_proce_tr", label: "Fecha"}),
                            search.createColumn({name: "internalid", label: "ID interno"}),
                            search.createColumn({name: "custrecord_tkio_transaccion_id", label: "ID transaccion"}),
                            search.createColumn({name: "custrecord_tkio_procesado_tr", label: "Procesado"}),
                            search.createColumn({name: "custrecord_tkio_json_transaccion", label: "json"}),

                        ]
                });
                var searchResultCount = customrecord_tkio_reg_timbradoSearchObj.runPaged().count;
                log.debug("customrecord_tkio_reg_timbradoSearchObj result count",searchResultCount);

                return customrecord_tkio_reg_timbradoSearchObj;

            }catch (e) {

                log.audit({
                    title: 'Error ',
                    details: e
                });
            }


        }

        /**
         * Executes when the map entry point is triggered and applies to each key/value pair.
         *
         * @param {MapSummary} context - Data collection containing the key/value pairs to process through the map stage
         * @since 2015.1
         */
        function map(context)
        {
            try{
                var datos = JSON.parse(context.value);

                var peticion = datos.id;
                context.write({
                    key: peticion,
                    value: datos.values
                });


            } catch (e) {
                log.audit({
                    title: 'Error ',
                    details: e
                });
            }

        }

        /**
         * Executes when the summarize entry point is triggered and applies to the result set.
         *
         * @param {Summary} summary - Holds statistics regarding the execution of a map/reduce script
         * @since 2015.1
         */
        function reduce(context)
        {
            try{
                var Json2 = JSON.parse((context.values[0]));
                log.debug("Json2 ",Json2);
                var peticion = JSON.parse(Json2.custrecord_tkio_json_transaccion);
                log.debug("peticion ",peticion);
                var Autofactura = '';

                log.debug("peticion.subtipo ",peticion.subtipo);

                if(peticion.subtipo == 1){
                    var Respuesta = PagoEfectivo(peticion,Json2);
                    log.audit({
                        title: 'Respuesta ',
                        details: Respuesta
                    });
                }
                if(peticion.subtipo == 2){
                    var Respuesta = PagoCredito(peticion,Json2);
                    log.audit({
                        title: 'Respuesta ',
                        details: Respuesta
                    });
                }
                if(peticion.subtipo == 3){
                    var Respuesta = AjustarInventario(peticion,Json2);
                    log.audit({
                        title: 'Respuesta ',
                        details: Respuesta
                    });
                }
                if(peticion.subtipo == 4){
                    var Respuesta = TrasnferenciaDeinventario(peticion,Json2);
                    log.audit({
                        title: 'Respuesta ',
                        details: Respuesta
                    });
                }
                if(peticion.subtipo == 5){
                    var Respuesta = PagoACliente(peticion,Json2)
                    log.audit({
                        title: 'Respuesta ',
                        details: Respuesta
                    });
                }
                log.debug("Respuesta ",Respuesta);
                var Regtimb = record.load({
                    type: 'customrecord_tkio_reg_timbrado',
                    isDynamic: true,
                    id: Json2.internalid.value,
                })

                Regtimb.setValue({
                    fieldId: 'custrecord_tkio_procesado_tr',
                    value: true
                })

                Regtimb.setValue({
                    fieldId: 'custrecord_tkio_details_error',
                    value: 'Procesado!!!'
                })
                Regtimb.save();


            } catch (e) {
                var Json2 = JSON.parse((context.values[0]));
                if(Json2){
                    var Regtimb = record.load({
                        type: 'customrecord_tkio_reg_timbrado',
                        isDynamic: true,
                        id: Json2.internalid.value,
                    })

                    Regtimb.setValue({
                        fieldId: 'custrecord_tkio_details_error',
                        value: e.message
                    })

                    Regtimb.save();
                }


                log.audit({
                    title: 'error ',
                    details: e
                });
            }

        }

        function PagoEfectivo(peticion,Json2) {
           try {
               log.audit({
                   title: 'PagoEfectivo '
               });
               /* ejemplo
                 {
                     "tipo": 8,
                     "subtipo": 1,
                     "ubicacion": 70,
                     "cliente": 2686,
                     "transportistas": 5232,
                     "articulos": {
                         "1731": {
                                 "idArticulo": 1731,
                                 "cantidad": 10,
                                 "impuesto": 21,
                                 "monto": 2000
                                 },
                                "1968": {
                                  "idArticulo": 1968,
                                  "cantidad": 40,
                                  "impuesto": 21,
                                  "monto": 4000
                                       }
                                   }
                }*/


               var cashsale = record.create({
                   type: 'cashsale',
                   isDynamic: true
               });
               log.audit({title:'peticion.cliente',details:peticion.cliente})
               cashsale.setValue({fieldId:'entity',value: peticion.cliente});
               cashsale.setValue({fieldId:'location',value: peticion.ubicacion});
               cashsale.setValue({fieldId:'custbody1',value: 3 });
               cashsale.setValue({fieldId:'custbody2',value: 1 });
               cashsale.setValue({fieldId:'custbody_mx_cfdi_usage',value: 3 });
               cashsale.setValue({fieldId:'custbody_mx_txn_sat_payment_method',value: 1});
               cashsale.setValue({fieldId:'custbody_mx_txn_sat_payment_term',value: 3});
               cashsale.setValue({fieldId:'custbody_psg_ei_template',value: 18});
               cashsale.setValue({fieldId:'custbody_efx_proveedortransportista',value: peticion.transportistas});
               cashsale.setValue({fieldId:'custbody_psg_ei_sending_method',value: 6});

               var arrayItemsCS = peticion.articulos
               var clavesCS = Object.keys(arrayItemsCS);

               for (var i = 0; i < clavesCS.length; i++){
                   var precioUnitario = parseFloat(arrayItemsCS[clavesCS[i]].monto) / parseFloat(arrayItemsCS[clavesCS[i]].cantidad)

                   cashsale.selectNewLine({sublistId : 'item'});
                   cashsale.setCurrentSublistValue({
                       sublistId : 'item',
                       fieldId   : 'item',
                       value     : arrayItemsCS[clavesCS[i]].idArticulo
                   });
                   var descripcion= cashsale.getCurrentSublistText({
                       sublistId : 'item',
                       fieldId   : 'item',
                   });

                   cashsale.setCurrentSublistValue({
                       sublistId : 'item',
                       fieldId   : 'taxcode',
                       value     : arrayItemsCS[clavesCS[i]].impuesto
                   });
                   cashsale.setCurrentSublistValue({
                       sublistId : 'item',
                       fieldId   : 'quantity',
                       value     : arrayItemsCS[clavesCS[i]].cantidad
                   });
                   cashsale.setCurrentSublistValue({
                       sublistId : 'item',
                       fieldId   : 'rate',
                       value     : precioUnitario
                   });
                   cashsale.setCurrentSublistValue({
                       sublistId : 'item',
                       fieldId   : 'description',
                       value     : descripcion
                   });
                   cashsale.setCurrentSublistValue({
                       sublistId : 'item',
                       fieldId   : 'custcol_mx_txn_line_sat_item_code',
                       value     : 19401
                   });

                   cashsale.commitLine({sublistId : 'item'});
               }
               var salvadoCashsale = cashsale.save()
               log.audit({
                   title: 'PagoEfectivo ',
                   details: salvadoCashsale
               });
               var SLURL = url.resolveScript({
                   scriptId: 'customscript_efx_fe_xml_generator',
                   deploymentId: 'customdeploy_efx_fe_xml_generator',
                   returnExternalUrl: true,
                   params: {
                       trantype: 'cashsale',
                       tranid: salvadoCashsale

                   }
               });
               var response = https.get({
                   url: SLURL,
               });
               var Regtimb = record.load({
                   type: 'customrecord_tkio_reg_timbrado',
                   id: Json2.internalid.value,
                   isDynamic: true,
               })

               Regtimb.setValue({
                   fieldId: 'custrecord_tkio_transaccion_id',
                   value: salvadoCashsale
               })

               var respuesta = Regtimb.save();
               log.audit({
                   title: 'respuesta ',
                   details: respuesta
               });
               return respuesta
           }catch (e) {
               if(Json2){
                   var Regtimb = record.load({
                       type: 'customrecord_tkio_reg_timbrado',
                       isDynamic: true,
                       id: Json2.internalid.value,
                   })

                   Regtimb.setValue({
                       fieldId: 'custrecord_tkio_details_error',
                       value: e.message
                   })

                   Regtimb.save();
                   return null
               }


               log.audit({
                   title: 'error ',
                   details: e
               });
           }
        }

        function PagoCredito(peticion,Json2) {
            try {
                /*{
                                         "tipo": 8,
                                         "subtipo": 2,
                                         "ubicacion": 70,
                                         "cliente": 2686,
                                         "transportistas": 5232,
                                         "articulos": {
                                         "1731": {
                                             "idArticulo": 1731,
                                                 "cantidad": 10,
                                                 "impuesto": 21,
                                                 "monto": 2001,
                                                 "ubicacion": 70
                                         },
                                         "1968": {
                                             "idArticulo": 1968,
                                                 "cantidad": 40,
                                                 "impuesto": 21,
                                                 "monto": 4002,
                                                 "ubicacion": 70
                                         }
                                     }
                   }*/

                var InfoCliente = record.load({type: 'customer',
                    id: peticion.cliente})

                Autofactura = InfoCliente.getValue({fieldId: 'custentity_tkio_kimetrix_timbrado_auto'})


                var SalesOrder = record.create({
                    type: 'salesorder',
                    isDynamic: true
                });

                SalesOrder.setValue({fieldId:'entity',value: peticion.cliente});
                SalesOrder.setValue({fieldId:'location',value: peticion.ubicacion});
                SalesOrder.setValue({fieldId:'custbody1',value: 1});
                SalesOrder.setValue({fieldId:'custbody2',value: 3});
                SalesOrder.setValue({fieldId:'custbody_efx_proveedortransportista',value: peticion.transportistas});
                SalesOrder.setValue({fieldId:'custbody_mx_cfdi_usage',value: 3 });
                SalesOrder.setValue({fieldId:'custbody_mx_txn_sat_payment_method',value: 1});
                SalesOrder.setValue({fieldId:'custbody_mx_txn_sat_payment_term',value: 3});

                var arrayItemsSO = peticion.articulos
                var clavesSO = Object.keys(arrayItemsSO);

                for (var i = 0; i < clavesSO.length; i++){
                    var precioUnitario = parseFloat(arrayItemsSO[clavesSO[i]].monto) / parseFloat(arrayItemsSO[clavesSO[i]].cantidad)
                    SalesOrder.selectNewLine({sublistId : 'item'});
                    SalesOrder.setCurrentSublistValue({
                        sublistId : 'item',
                        fieldId   : 'item',
                        value     : arrayItemsSO[clavesSO[i]].idArticulo
                    });
                    var descripcion= SalesOrder.getCurrentSublistText({
                        sublistId : 'item',
                        fieldId   : 'item',
                    });
                    SalesOrder.setCurrentSublistValue({
                        sublistId : 'item',
                        fieldId   : 'amount',
                        value     : arrayItemsSO[clavesSO[i]].monto
                    });
                    SalesOrder.setCurrentSublistValue({
                        sublistId : 'item',
                        fieldId   : 'taxcode',
                        value     : arrayItemsSO[clavesSO[i]].impuesto
                    });
                    SalesOrder.setCurrentSublistValue({
                        sublistId : 'item',
                        fieldId   : 'quantity',
                        value     : arrayItemsSO[clavesSO[i]].cantidad
                    });
                    SalesOrder.setCurrentSublistValue({
                        sublistId : 'item',
                        fieldId   : 'rate',
                        value     : precioUnitario
                    });
                    SalesOrder.setCurrentSublistValue({
                        sublistId : 'item',
                        fieldId   : 'description',
                        value     : descripcion
                    });
                    SalesOrder.setCurrentSublistValue({
                        sublistId : 'item',
                        fieldId   : 'custcol_mx_txn_line_sat_item_code',
                        value     : 19401
                    });
                    SalesOrder.setCurrentSublistValue({
                        sublistId : 'item',
                        fieldId   : 'location',
                        value     : arrayItemsSO[clavesSO[i]].ubicacion
                    });
                    SalesOrder.commitLine({sublistId : 'item'});
                }
                var salvadoSalesOrder = SalesOrder.save();

                var ItemFull = record.transform({
                    fromType: 'salesorder',
                    fromId: salvadoSalesOrder,
                    toType: 'itemfulfillment',
                    isDynamic: false,
                });
                var arrayItemsIF = peticion.articulos
                var clavesIF = Object.keys(arrayItemsIF);

                var numLinepay = ItemFull.getLineCount({sublistId: 'item'});

                for (var j = 0; j < numLinepay; j++){
                    var arttemp = ItemFull.getSublistValue({
                        sublistId: 'item',
                        fieldId: 'item',
                        line:j ,
                    })
                    for(var i=0;i<clavesIF.length;i++){
                        if(arttemp==clavesIF[i]) {
                            ItemFull.setSublistValue({
                                sublistId: 'item',
                                fieldId: 'itemreceive',
                                line:j ,
                                value: true
                            });
                            ItemFull.setSublistValue({
                                sublistId: 'item',
                                fieldId: 'quantity',
                                line:j ,
                                value: peticion.articulos[clavesIF[i]].cantidad
                            });
                        }

                    }
                }
                var saveItemFull = ItemFull.save();
                log.audit({
                    title: 'Autofactura ',
                    details: Autofactura
                });
                if(Autofactura == 'T'){
                    var InvoSO = record.transform({
                        fromType: 'salesorder',
                        fromId: salvadoSalesOrder,
                        toType: 'invoice',
                        isDynamic: true,
                    });

                    InvoSO.setValue({fieldId:'custbody_psg_ei_template',value: 20});
                    InvoSO.setValue({fieldId:'custbody_psg_ei_sending_method',value: 6});
                    var salvadoInvoSO = InvoSO.save();

                    var SLURL = url.resolveScript({
                        scriptId: 'customscript_efx_fe_xml_generator',
                        deploymentId: 'customdeploy_efx_fe_xml_generator',
                        returnExternalUrl: true,
                        params: {
                            trantype: 'invoice',
                            tranid: salvadoInvoSO

                        }
                    });
                    log.audit({
                        title: 'salvadoInvoSO ',
                        details: salvadoInvoSO
                    });
                    var response = https.get({
                        url: SLURL,
                    });
                    var Regtimb = record.load({
                        type: 'customrecord_tkio_reg_timbrado',
                        id: Json2.internalid.value,
                        isDynamic: true,
                    })

                    Regtimb.setValue({
                        fieldId: 'custrecord_tkio_transaccion_id',
                        value: salvadoInvoSO
                    })

                    Regtimb.save();
                }else{
                    var Regtimb = record.load({
                        type: 'customrecord_tkio_reg_timbrado',
                        id: Json2.internalid.value,
                        isDynamic: true,
                    })

                    Regtimb.setValue({
                        fieldId: 'custrecord_tkio_transaccion_id',
                        value: saveItemFull
                    })

                    var respuesta = Regtimb.save();
                    return respuesta
                }
            }
            catch (e) {
                if(Json2){
                    var Regtimb = record.load({
                        type: 'customrecord_tkio_reg_timbrado',
                        isDynamic: true,
                        id: Json2.internalid.value,
                    })

                    Regtimb.setValue({
                        fieldId: 'custrecord_tkio_details_error',
                        value: e.message
                    })

                    Regtimb.save();
                    return null
                }


                log.audit({
                    title: 'error ',
                    details: e
                });
            }
        }

        function AjustarInventario(peticion,Json2) {
            try {
                /*
                                   {
                                    "tipo": 8,
                                    "subtipo": 3,
                                    "ubicacion": 70,
                                    "cliente": 2686,
                                    "articulos": {
                                    "1731": {
                                        "idArticulo": 1731,
                                            "cantidad": 10,
                                            "ubicacion": 70
                                    },
                                    "1968": {
                                        "idArticulo": 1968,
                                            "cantidad": 40,
                                            "ubicacion": 70
                                    }
                                }
                                }
                                    * */
                var AjusteInv = record.create({
                    type: 'inventoryadjustment',
                    isDynamic: true
                });

                AjusteInv.setValue({fieldId:'entity',value: peticion.cliente});
                AjusteInv.setValue({fieldId:'adjlocation',value: peticion.ubicacion});
                AjusteInv.setValue({fieldId:'account',value: 775 });
                AjusteInv.setValue({fieldId:'custbody_effx_tipodeajuste',value: 4 });

                var arrayItemsIF = peticion.articulos
                var clavesIF = Object.keys(arrayItemsIF);

                for (var i = 0; i < clavesIF.length; i++){
                    AjusteInv.selectNewLine({sublistId : 'inventory'});
                    AjusteInv.setCurrentSublistValue({
                        sublistId : 'inventory',
                        fieldId   : 'item',
                        value     : arrayItemsIF[clavesIF[i]].idArticulo
                    });
                    AjusteInv.setCurrentSublistValue({
                        sublistId : 'inventory',
                        fieldId   : 'adjustqtyby',
                        value     : arrayItemsIF[clavesIF[i]].cantidad
                    });
                    AjusteInv.setCurrentSublistValue({
                        sublistId : 'inventory',
                        fieldId   : 'location',
                        value     : arrayItemsIF[clavesIF[i]].ubicacion
                    });
                    AjusteInv.commitLine({sublistId : 'inventory'});
                }
                var salvadoTraslado = AjusteInv.save()

                var Regtimb = record.load({
                    type: 'customrecord_tkio_reg_timbrado',
                    id: Json2.internalid.value,
                    isDynamic: true,
                })

                Regtimb.setValue({
                    fieldId: 'custrecord_tkio_transaccion_id',
                    value: salvadoTraslado
                })

                Regtimb.save();
            }catch (e) {
                if(Json2){
                    var Regtimb = record.load({
                        type: 'customrecord_tkio_reg_timbrado',
                        isDynamic: true,
                        id: Json2.internalid.value,
                    })

                    Regtimb.setValue({
                        fieldId: 'custrecord_tkio_details_error',
                        value: e.message
                    })

                    Regtimb.save();
                }


                log.audit({
                    title: 'error ',
                    details: e
                });
            }
        }

        function TrasnferenciaDeinventario(peticion,Json2) {
            try {
                /*
                     {
                                   "tipo": 8,
                                   "subtipo": 4,
                                   "ubicacionOrigen": 70,
                                   "ubicaciontraslado": 71,
                                   "articulos": {
                                   "1731": {
                                       "idArticulo": 1731,
                                           "cantidad": 1
                                   },
                                   "1968": {
                                       "idArticulo": 1968,
                                           "cantidad": 2
                                   }
                               }
                               }
                                   * */

                var traslado = record.create({
                    type: 'inventorytransfer',
                    isDynamic: true
                });

                traslado.setValue({fieldId:'location',value: peticion.ubicacionOrigen});
                traslado.setValue({fieldId:'transferlocation',value: peticion.ubicaciontraslado});
                traslado.setValue({fieldId:'custbody1',value: 3 });
                traslado.setValue({fieldId:'custbody2',value: 1 });

                var arrayItemsT = peticion.articulos
                var clavesT = Object.keys(arrayItemsT);

                for (var i = 0; i < clavesT.length; i++) {
                    traslado.selectNewLine({sublistId : 'inventory'});
                    traslado.setCurrentSublistValue({
                        sublistId : 'inventory',
                        fieldId   : 'item',
                        value     : arrayItemsT[clavesT[i]].idArticulo
                    });
                    traslado.setCurrentSublistValue({
                        sublistId : 'inventory',
                        fieldId   : 'itemcount',
                        value     : arrayItemsT[clavesT[i]].cantidad
                    });
                    traslado.setCurrentSublistValue({
                        sublistId : 'inventory',
                        fieldId   : 'adjustqtyby',
                        value     : arrayItemsT[clavesT[i]].cantidad
                    });
                    traslado.commitLine({sublistId : 'inventory'});
                }

                var salvadoTraslado = traslado.save()

                var Regtimb = record.load({
                    type: 'customrecord_tkio_reg_timbrado',
                    id: Json2.internalid.value,
                    isDynamic: true,
                })

                Regtimb.setValue({
                    fieldId: 'custrecord_tkio_transaccion_id',
                    value: salvadoTraslado
                })

                Regtimb.save();

            }catch (e) {
                if(Json2){
                    var Regtimb = record.load({
                        type: 'customrecord_tkio_reg_timbrado',
                        isDynamic: true,
                        id: Json2.internalid.value,
                    })

                    Regtimb.setValue({
                        fieldId: 'custrecord_tkio_details_error',
                        value: e.message
                    })

                    Regtimb.save();
                }


                log.audit({
                    title: 'error ',
                    details: e
                });
            }
        }

        function PagoACliente(peticion,Json2) {
            try {
                /*
                                   {
                                   "tipo": 8,
                                   "subtipo": 5,
                                   "ubicacion": 70,
                                   "metodoPago": 71,
                                   "articulos": {
                                   "1731": {
                                       "idArticulo": 1731,
                                           "cantidad": 1
                                   },
                                   "1968": {
                                       "idArticulo": 1968,
                                           "cantidad": 2
                                   }
                               }
                               }
                                   * */

                var Payment = record.create({
                    type: 'customerpayment',
                    isDynamic: true
                });

                Payment.setValue({fieldId:'entity',value: peticion.cliente});
                Payment.setValue({fieldId:'location',value: peticion.ubicacion});
                Payment.setValue({fieldId:'custbody_mx_txn_sat_payment_method',value: peticion.metodoPago});
                Payment.setValue({fieldId:'exchangerate',value: peticion.tipoDeCambio});
                Payment.setValue({fieldId:'payment',value: peticion.monto});
                var numLinepay = Payment.getLineCount({sublistId: 'apply'});

                for (var j = 0; j < numLinepay; j++){
                    if(Payment.getSublistValue({
                        sublistId: 'apply',
                        fieldId: 'internalid',
                        line: j
                    }) == peticion.idfactura)
                    {
                        Payment.setSublistValue({
                            sublistId: 'apply',
                            fieldId: 'apply',
                            line:j ,
                            value: true
                        });
                        Payment.setSublistValue({
                            sublistId: 'apply',
                            fieldId: 'amount',
                            line:j ,
                            value: peticion.monto
                        });


                    }

                }

                var salvadoPayment = Payment.save()
                return salvadoPayment;
            }catch (e) {
                if(Json2){
                    var Regtimb = record.load({
                        type: 'customrecord_tkio_reg_timbrado',
                        isDynamic: true,
                        id: Json2.internalid.value,
                    })

                    Regtimb.setValue({
                        fieldId: 'custrecord_tkio_details_error',
                        value: e.message
                    })

                    Regtimb.save();
                    return null
                }


                log.audit({
                    title: 'error ',
                    details: e
                });
            }
        }


        return {
            getInputData: getInputData,
            map: map,
            reduce: reduce,
        };

    });