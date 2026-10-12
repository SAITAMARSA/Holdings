/* Green Home Store: navigation, submenus, ticker control, form marker. */
(function () {
	"use strict";

	// Tell the quote handler this submission came through a browser.
	var markers = document.querySelectorAll( 'input[name="ghstore_js"]' );
	for ( var m = 0; m < markers.length; m++ ) {
		markers[ m ].value = "1";
	}

	/* ---------- highlights ticker: pause / play ---------- */
	var ticker       = document.querySelector( ".ticker" );
	var tickerToggle = ticker ? ticker.querySelector( ".ticker-toggle" ) : null;
	if ( tickerToggle ) {
		tickerToggle.addEventListener(
			"click",
			function () {
				var paused = ticker.classList.toggle( "is-paused" );
				tickerToggle.setAttribute( "aria-pressed", String( paused ) );
				tickerToggle.setAttribute( "aria-label", tickerToggle.getAttribute( paused ? "data-play" : "data-pause" ) );
			}
		);
	}

	/* ---------- header navigation ---------- */
	var toggle = document.querySelector( ".nav-toggle" );
	var links  = document.getElementById( "site-nav" );
	if ( ! toggle || ! links ) {
		return;
	}

	function setOpen( open ) {
		links.classList.toggle( "open", open );
		toggle.setAttribute( "aria-expanded", String( open ) );
		if ( open ) {
			var first = links.querySelector( "a, button" );
			if ( first ) {
				first.focus();
			}
		}
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
		function ( event ) {
			if ( event.target.closest( "a" ) ) {
				setOpen( false );
			}
		}
	);

	document.addEventListener(
		"click",
		function ( event ) {
			if ( links.classList.contains( "open" ) && ! event.target.closest( ".site-header" ) ) {
				setOpen( false );
			}
		}
	);

	/* ---------- drop-down submenus: disclosure buttons ---------- */
	var parents   = links.querySelectorAll( ".menu > .menu-item-has-children" );
	var openLabel = links.getAttribute( "data-submenu-label" ) || "Open submenu for";

	function closeSubmenus( except ) {
		for ( var i = 0; i < parents.length; i++ ) {
			if ( parents[ i ] !== except ) {
				parents[ i ].classList.remove( "is-open" );
				var b = parents[ i ].querySelector( ".sub-toggle" );
				if ( b ) {
					b.setAttribute( "aria-expanded", "false" );
				}
			}
		}
	}

	for ( var p = 0; p < parents.length; p++ ) {
		(function ( item, index ) {
			var link = null;
			var sub  = null;
			for ( var c = 0; c < item.children.length; c++ ) {
				if ( "A" === item.children[ c ].tagName ) {
					link = item.children[ c ];
				} else if ( item.children[ c ].classList.contains( "sub-menu" ) ) {
					sub = item.children[ c ];
				}
			}
			if ( ! link || ! sub ) {
				return;
			}
			if ( ! sub.id ) {
				sub.id = "sub-menu-" + ( index + 1 );
			}

			var button       = document.createElement( "button" );
			button.type      = "button";
			button.className = "sub-toggle";
			button.setAttribute( "aria-expanded", "false" );
			button.setAttribute( "aria-controls", sub.id );
			button.innerHTML              = '<span class="screen-reader-text"></span><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="m6 9 6 6 6-6"/></svg>';
			button.firstChild.textContent = openLabel + " " + link.textContent.trim();
			link.insertAdjacentElement( "afterend", button );

			button.addEventListener(
				"click",
				function () {
					var open = ! item.classList.contains( "is-open" );
					closeSubmenus( item );
					item.classList.toggle( "is-open", open );
					button.setAttribute( "aria-expanded", String( open ) );
				}
			);

			item.addEventListener(
				"focusout",
				function ( event ) {
					if ( ! item.contains( event.relatedTarget ) ) {
						item.classList.remove( "is-open" );
						button.setAttribute( "aria-expanded", "false" );
					}
				}
			);
		})( parents[ p ], p );
	}

	document.addEventListener(
		"keydown",
		function ( event ) {
			if ( "Escape" !== event.key ) {
				return;
			}
			var openItem = links.querySelector( ".menu-item-has-children.is-open" );
			if ( openItem ) {
				closeSubmenus();
				var openButton = openItem.querySelector( ".sub-toggle" );
				if ( openButton ) {
					openButton.focus();
				}
				return;
			}
			if ( links.classList.contains( "open" ) ) {
				setOpen( false );
				toggle.focus();
			}
		}
	);
})();
