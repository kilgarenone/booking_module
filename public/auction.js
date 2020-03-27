const socket = io.connect("http://localhost:4000");

// Get elements
const price = document.getElementById("price");
const auctionFeeds = document.getElementById("auction-feeds");
const enter = document.getElementById("entry");

function displayBids(bids) {
  auctionFeeds.innerHTML += bids;
}

enter.addEventListener("click", function() {
  // emit 'chat' event to server's socket along with some data
  socket.emit("join", displayBids);
});

// client is listening on 'chat' event emitted from server, receiving data too
socket.on("chat", function() {
  auctionFeeds.innerHTML += data.hello;
});
