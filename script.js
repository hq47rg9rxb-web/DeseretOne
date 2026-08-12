const button = document.getElementById('actionButton');
const message = document.getElementById('message');

if (button && message) {
  button.addEventListener('click', () => {
    message.textContent = 'DeseretOne is set up and ready to grow.';
  });
}
