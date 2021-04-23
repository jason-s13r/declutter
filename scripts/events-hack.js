window.__declutterEventQueue = {};
window.__declutterDOMContentLoaded = false;
window.__addEventListener = window.document.addEventListener;
window.document.addEventListener = function (event, handler) {
	if (event.toLowerCase() === 'domcontentloaded') {
		event = 'DOMContentLoaded';
	}
	if (!window.__declutterDOMContentLoaded && event == 'DOMContentLoaded') {
		window.__declutterEventQueue[event] = window.__declutterEventQueue[event] || [];
		window.__declutterEventQueue[event].push(handler);
	}
	try { handler(); } catch (e) { }
};
window.__declutterTrigger = function (event) {
	if (event === 'DOMContentLoaded') {
		window.__declutterDOMContentLoaded = true;
	}
	if (window.__declutterEventQueue[event] && window.__declutterEventQueue[event].map) {
		window.__declutterEventQueue[event].map(c => { try { c() } catch (e) { } });
	}
};