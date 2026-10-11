/* Green Home Store: mobile navigation toggle. */
(function () {
	"use strict";

	var toggle = document.querySelector( ".nav-toggle" );
	var links  = document.getElementById( "site-nav" );
	if ( ! toggle || ! links) {
		return;
	}

	function setOpen(open) {
		links.classList.toggle( "open", open );
		toggle.setAttribute( "aria-expanded", String( open ) );
	}

	toggle.addEventListener(
		"click",
		function () {
			setOpen( ! links.classList.contains( "open" ) );
		}
	);

	// Links to home page sections (#faq, #quote…) don't reload the page, so
	// close the menu ourselves.
	links.addEventListener(
		"click",
		function (event) {
			if (event.target.closest( "a" )) {
				setOpen( false );
			}
		}
	);

	document.addEventListener(
		"keydown",
		function (event) {
			if (event.key === "Escape" && links.classList.contains( "open" )) {
				setOpen( false );
				toggle.focus();
			}
		}
	);
})();
