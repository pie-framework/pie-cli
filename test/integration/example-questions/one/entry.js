
import PiePlayer from 'pie-player';
document.registerElement('pie-player', PiePlayer);

import comp0 from 'hello-world';
document.registerElement('hello-world', comp0);

import ClientSideController from 'pie-client-side-controller';
window.pie = window.pie || {};
window.pie.ClientSideController = ClientSideController;
