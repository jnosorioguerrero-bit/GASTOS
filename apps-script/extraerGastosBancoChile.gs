function extraerGastosBancoChile() {
  var FIREBASE_URL = 'https://gastos-3b09b-default-rtdb.firebaseio.com';
  var API_KEY = 'AIzaSyDzhwFYm_A4rzTtWvn0CQTNhDjL5gy9S8A';

  var token = obtenerTokenFirebase_(API_KEY);

  // IDs ya guardados (shallow: solo trae las llaves, no los datos completos)
  var existingResp = UrlFetchApp.fetch(FIREBASE_URL + '/gastos_banco.json?shallow=true&auth=' + token);
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
        UrlFetchApp.fetch(FIREBASE_URL + '/gastos_banco/' + messageId + '.json?auth=' + token, {
          method: 'put',
          contentType: 'application/json',
          payload: JSON.stringify(payload)
        });
      }
    }
  }
}

function obtenerTokenFirebase_(apiKey) {
  var resp = UrlFetchApp.fetch('https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=' + apiKey, {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify({ returnSecureToken: true })
  });
  return JSON.parse(resp.getContentText()).idToken;
}
