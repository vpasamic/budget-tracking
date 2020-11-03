let db;
const request = indexedDB.open("budget", 1);
request.onupgradeneeded = function (event) {
  db = event.target.result;
  const objectStore = db.createObjectStore("pending", {
    autoIncrement: true
  });
};
request.onsuccess = function (event) {
  db = event.target.result;
  if (navigator.onLine) {
    checkDatabase();
  }
};
request.onerror = function (event) {
  console.log(request.error);
};
function saveRecord(record) {
  const transaction = db.transaction(["pending"], "readwrite");
  const store = transaction.objectStore("pending");
  store.add(record);
}
function checkDatabase() {
  const transaction = db.transaction(["pending"], "readwrite");
  const store = transaction.objectStore("pending");
  const getAll = store.getAll();
  getAll.onsuccess = function () {
    if (getAll.result.length > 0) {
      fetch('/api/transaction/bulk', {
        method: 'POST',
        body: JSON.stringify(getAll.result),
        headers: {
          Accept: 'application/json, text/plain, */*',
          'Content-Type': 'application/json',
        },
      })
        .then((response) => response.json())
        .then(() => {
          const transaction = db.transaction(["pending"], "readwrite");
          const store = transaction.objectStore("pending");
          store.clear();
        });
    }
  };
}
function clearDatabase() {
  const transaction = db.transaction(["pending"], "readwrite");
  const store = transaction.objectStore("pending");
  const getCursorRequest = store.openCursor();
  getCursorRequest.onsuccess = e => {
    const cursor = e.target.result;
    if (cursor) {
      if (cursor.value.value >= 0) {
        cursor.value.value = 0
        const request = cursor.update(cursor.value);
        request.onsuccess = function () {
          console.log("Changed to 0");
        }
      }
      console.log(cursor.value);
      cursor.continue();
    } else {
      console.log("No documents left!");
    }
  };
}
window.addEventListener('online', checkDatabase);
