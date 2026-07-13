function extraerGastosBancoChile() {
  var FIREBASE_URL = 'https://gastos-3b09b-default-rtdb.firebaseio.com';
  // /gastos_banco es de lectura/escritura pública en las reglas de Firebase
  // (mismo nivel de exposición que ya tenía el Google Sheet) — no requiere
  // autenticación. La única razón de esto es que Apps Script recibía
  // "API key not valid" al intentar autenticarse contra Identity Toolkit,
  // incluso con una clave nueva sin restricciones; el resto de la app
  // (cc-tracker) sí exige login para todo lo que no sea esta ruta.

  // IDs ya guardados (shallow: solo trae las llaves, no los datos completos)
  var existingResp = UrlFetchApp.fetch(FIREBASE_URL + '/gastos_banco.json?shallow=true');
  var existing = JSON.parse(existingResp.getContentText()) || {};

  // 2. Buscar correos del Banco de Chile
  var query = 'from:enviodigital@bancochile.cl "se ha realizado una compra por"';
  var threads = GmailApp.search(query, 0, 20);

  // 3. Procesar cada correo encontrado
  for (var i = threads.length - 1; i >= 0; i--) {
    var messages = threads[i].getMessages();
    for (var j = 0; j < messages.length; j++) {
      var message = messages[j];
      var messageId = message.getId();

      // Si el correo ya fue procesado antes, lo saltamos
      if (existing[messageId]) continue;

      var body = message.getPlainBody();

      // 4. Expresiones regulares para capturar los datos del formato del correo
      var regexMonto = /por\s+\$([\d\.]+)/;
      var regexTarjeta = /Tarjeta de Crédito\s+(\*\*\*\*\d+)/;
      var regexComercio = /en\s+(.*?)\s+el\s+/;
      var regexFecha = /el\s+(\d{2}\/\d{2}\/\d{4}\s+\d{2}:\d{2})/;

      var matchMonto = body.match(regexMonto);
      var matchTarjeta = body.match(regexTarjeta);
      var matchComercio = body.match(regexComercio);
      var matchFecha = body.match(regexFecha);

      if (matchMonto && matchComercio) {
        // Limpieza de datos (quitar puntos al monto para que se lea como número)
        var montoStr = matchMonto[1].replace(/\./g, "");
        var monto = parseInt(montoStr, 10);

        var tarjeta = matchTarjeta ? matchTarjeta[1] : "TC";
        var comercio = matchComercio[1].trim();
        var fechaStr = matchFecha ? matchFecha[1] : Utilities.formatDate(message.getDate(), 'GMT-4', 'dd/MM/yyyy HH:mm');

        var payload = {
          date: fechaStr,
          description: comercio,
          amount: monto,
          bank: "Banco de Chile",
          medio: tarjeta,
          refId: messageId
        };

        // 5. Insertar los datos en Firebase (la llave = messageId evita duplicados)
        UrlFetchApp.fetch(FIREBASE_URL + '/gastos_banco/' + messageId + '.json', {
          method: 'put',
          contentType: 'application/json',
          payload: JSON.stringify(payload)
        });
      }
    }
  }
}
