<?php
/**
 * Template helpers: brand, menus, contact links, editable lists, meta tags.
 *
 * @package GreenHomeStore
 */

defined( 'ABSPATH' ) || exit;

/**
 * Logo linking home: the Customizer logo if set, otherwise the bundled
 * Green Home Systems logo.
 *
 * @param string $context "header" or "footer".
 */
function ghstore_brand( $context = 'header' ) {
	if ( has_custom_logo() ) {
		echo '<div class="brand brand-' . esc_attr( $context ) . '">';
		the_custom_logo();
		echo '</div>';
		return;
	}
	?>
	<a class="brand brand-<?php echo esc_attr( $context ); ?>" href="<?php echo esc_url( home_url( '/' ) ); ?>" rel="home">
		<img src="<?php echo esc_url( get_template_directory_uri() . '/assets/images/logo.webp' ); ?>" width="500" height="147" alt="<?php echo esc_attr( get_bloginfo( 'name' ) ); ?>">
	</a>
	<?php
}

/**
 * Link to a section of the home page, e.g. ghstore_home_anchor( 'faq' ).
 *
 * @param string $id Section id.
 * @return string
 */
function ghstore_home_anchor( $id ) {
	return home_url( '/#' . $id );
}

/**
 * Where "Get a quote" buttons go: the quote form when the contact section is
 * shown, otherwise WhatsApp, a phone call, or an email.
 *
 * @return string Empty only when no contact method is configured at all.
 */
function ghstore_quote_url() {
	if ( ghstore_mod( 'show_quote' ) ) {
		return ghstore_home_anchor( 'quote-form' );
	}
	if ( ghstore_whatsapp_url() ) {
		return ghstore_whatsapp_url();
	}
	if ( ghstore_tel_url() ) {
		return ghstore_tel_url();
	}
	if ( is_email( ghstore_mod( 'email' ) ) ) {
		return 'mailto:' . ghstore_mod( 'email' );
	}

	return '';
}

/**
 * Quote link for a specific product or kit: the form, pre-filled, with the
 * same fallbacks as ghstore_quote_url().
 *
 * @param string $item     Product or kit name.
 * @param string $interest One of ghstore_quote_interests(), or ''.
 * @return string
 */
function ghstore_quote_link( $item, $interest = '' ) {
	$item = trim( wp_specialchars_decode( (string) $item, ENT_QUOTES ) );

	if ( ghstore_mod( 'show_quote' ) ) {
		$args = array( 'quote_item' => rawurlencode( $item ) );
		if ( $interest ) {
			$args['quote_interest'] = rawurlencode( $interest );
		}

		return add_query_arg( $args, home_url( '/' ) ) . '#quote-form';
	}

	/* translators: %s: product or kit name. */
	$message = sprintf( __( 'Hi, I’d like a quote for: %s', 'green-home-store' ), $item );
	if ( ghstore_whatsapp_url() ) {
		return ghstore_whatsapp_url( $message );
	}
	if ( ghstore_tel_url() ) {
		return ghstore_tel_url();
	}
	if ( is_email( ghstore_mod( 'email' ) ) ) {
		return 'mailto:' . ghstore_mod( 'email' ) . '?subject=' . rawurlencode( $message );
	}

	return '';
}

/**
 * Shop page URL, or empty without WooCommerce.
 *
 * @return string
 */
function ghstore_shop_url() {
	if ( function_exists( 'wc_get_page_id' ) && wc_get_page_id( 'shop' ) > 0 ) {
		return wc_get_page_permalink( 'shop' );
	}

	return '';
}

/**
 * WhatsApp chat link with an optional pre-filled message.
 *
 * @param string $message Message text; defaults to the Customizer greeting.
 * @return string Empty when no WhatsApp number is set.
 */
function ghstore_whatsapp_url( $message = '' ) {
	$number = preg_replace( '/\D+/', '', (string) ghstore_mod( 'whatsapp' ) );
	if ( ! $number ) {
		return '';
	}

	if ( '' === $message ) {
		$message = trim( (string) ghstore_mod( 'whatsapp_message' ) );
	}

	return 'https://wa.me/' . $number . ( '' !== $message ? '?text=' . rawurlencode( $message ) : '' );
}

/**
 * Phone number as a tel: link.
 *
 * @return string Empty when no phone number is set.
 */
function ghstore_tel_url() {
	$digits = preg_replace( '/[^\d+]+/', '', (string) ghstore_mod( 'phone' ) );

	return $digits ? 'tel:' . $digits : '';
}

/**
 * Split a textarea setting into its non-empty lines.
 *
 * @param string $text Text.
 * @return string[]
 */
function ghstore_lines( $text ) {
	return array_values( array_filter( array_map( 'trim', preg_split( '/\R/', (string) $text ) ) ) );
}

/**
 * Split "a | b | c" lines of a textarea setting into rows of $columns cells.
 * Lines with too few cells are skipped.
 *
 * @param string $text    Text.
 * @param int    $columns Cells per row.
 * @return string[][]
 */
function ghstore_rows( $text, $columns ) {
	$rows = array();
	foreach ( ghstore_lines( $text ) as $line ) {
		$cells = array_map( 'trim', explode( '|', $line, $columns ) );
		if ( count( $cells ) === $columns && '' !== $cells[0] ) {
			$rows[] = $cells;
		}
	}

	return $rows;
}

/**
 * Default FAQ entries, as "Question | Answer" lines.
 *
 * @return string[]
 */
function ghstore_default_faqs() {
	return array(
		__( 'How much can I save on my electricity bill? | Most homeowners save between 60-80% on their monthly electricity bills with a solar system. The exact amount depends on your current consumption, location, and the package size. Contact us for a personalized assessment.', 'green-home-store' ),
		__( 'How long does installation take? | A typical residential installation takes 2-3 days from start to finish. The timeline depends on system size and roof complexity. We’ll provide a detailed schedule when you request your quote.', 'green-home-store' ),
		__( 'Do solar panels work during cloudy weather? | Yes, solar panels still generate electricity on cloudy days, though at reduced capacity (about 25% of normal output). Modern systems with battery storage ensure you have power even when generation is low.', 'green-home-store' ),
		__( 'What warranty do you provide? | We offer 5-15 years warranty depending on your package. Solar panels typically last 25+ years. Inverters and batteries have separate warranties. All details are included in your quote.', 'green-home-store' ),
		__( 'Do you offer financing options? | Yes! We offer flexible financing options to make solar more affordable. Monthly payments can often be lower than your current electricity bill, so you save money from day one.', 'green-home-store' ),
		__( 'What about maintenance? | Solar systems require minimal maintenance. Occasional cleaning and annual inspections are recommended. We offer maintenance packages to keep your system running optimally.', 'green-home-store' ),
	);
}

/**
 * Default testimonials, as "Quote | Name | Town" lines.
 *
 * @return string[]
 */
function ghstore_default_testimonials() {
	return array(
		__( 'Green Home Systems transformed our home. We’ve cut our electricity bills by 75% and no longer worry about load shedding. Highly recommended! | Johann Pieterse | Cape Town', 'green-home-store' ),
		__( 'The installation team was professional and efficient. Everything is working perfectly. We’re generating excess power and saving money every day! | Sarah Mkazi | Johannesburg', 'green-home-store' ),
		__( 'Best investment we’ve made for our home. The customer service is outstanding and we’re seeing real savings. Thank you, Green Home Systems! | Trevor Van der Merwe | Durban', 'green-home-store' ),
		__( 'We haven’t noticed a single load shedding outage since installation. The 12KWH kit powers our whole house, even during Stage 6. Worth every rand. | Nomvula Mahlangu | Pretoria', 'green-home-store' ),
		__( 'From quote to installation took under a week. The team was upfront about pricing with no hidden costs. Our business hasn’t lost a single hour of trading since. | Riaan de Klerk | Gqeberha', 'green-home-store' ),
		__( 'I used the financing option and was approved within two days. My monthly repayment is lower than what I used to pay Eskom. Should have done this years ago. | Lindiwe Khumalo | Bloemfontein', 'green-home-store' ),
	);
}

/**
 * Header links shown until a menu is assigned to "Header menu".
 *
 * @param array $args wp_nav_menu() arguments.
 * @return string|void
 */
function ghstore_menu_fallback( $args = array() ) {
	$links = array( array( home_url( '/' ), __( 'Home', 'green-home-store' ), is_front_page() ) );

	if ( ghstore_shop_url() ) {
		$links[] = array( ghstore_shop_url(), __( 'Shop', 'green-home-store' ), function_exists( 'is_shop' ) && ( is_shop() || is_product_taxonomy() || is_product() ) );
	}

	$anchors = array(
		'kits'     => __( 'Solar Kits', 'green-home-store' ),
		'services' => __( 'Services', 'green-home-store' ),
		'faq'      => __( 'FAQ', 'green-home-store' ),
		'quote'    => __( 'Contact', 'green-home-store' ),
	);
	foreach ( $anchors as $id => $label ) {
		if ( ghstore_mod( 'show_' . $id ) ) {
			$links[] = array( ghstore_home_anchor( $id ), $label, false );
		}
	}

	$html = '<ul class="menu">';
	foreach ( $links as $link ) {
		list( $url, $label, $is_current ) = $link;
		$html                            .= sprintf(
			'<li class="menu-item"><a href="%1$s"%2$s>%3$s</a></li>',
			esc_url( $url ),
			$is_current ? ' aria-current="page"' : '',
			esc_html( $label )
		);
	}
	$html .= '</ul>';

	if ( isset( $args['echo'] ) && ! $args['echo'] ) {
		return $html;
	}
	echo $html; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- escaped above.
}

/**
 * Section heading block: small label, title and intro.
 *
 * @param string $eyebrow Small label above the title.
 * @param string $title   Title.
 * @param string $intro   Intro sentence.
 * @param string $tag     Heading tag.
 */
function ghstore_section_head( $eyebrow, $title, $intro = '', $tag = 'h2' ) {
	$tag = in_array( $tag, array( 'h1', 'h2' ), true ) ? $tag : 'h2';
	?>
	<div class="section-head">
		<?php if ( $eyebrow ) : ?>
			<span class="eyebrow"><?php echo esc_html( $eyebrow ); ?></span>
		<?php endif; ?>
		<<?php echo esc_html( $tag ); ?> class="section-title"><?php echo esc_html( $title ); ?></<?php echo esc_html( $tag ); ?>>
		<?php if ( $intro ) : ?>
			<p class="section-intro"><?php echo esc_html( $intro ); ?></p>
		<?php endif; ?>
	</div>
	<?php
}

/**
 * Date, author and categories line for posts.
 */
function ghstore_post_meta() {
	$parts = array(
		sprintf(
			'<time datetime="%1$s">%2$s</time>',
			esc_attr( get_the_date( DATE_W3C ) ),
			esc_html( get_the_date() )
		),
	);

	$author = get_the_author();
	if ( $author ) {
		$parts[] = sprintf(
			/* translators: %s: post author name. */
			esc_html__( 'by %s', 'green-home-store' ),
			'<a href="' . esc_url( get_author_posts_url( get_the_author_meta( 'ID' ) ) ) . '">' . esc_html( $author ) . '</a>'
		);
	}

	$categories = get_the_category_list( ', ' );
	if ( $categories && 'post' === get_post_type() ) {
		$parts[] = $categories;
	}

	echo '<div class="entry-meta">' . implode( ' · ', $parts ) . '</div>'; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- parts escaped above.
}

/**
 * Heading for the blog, archives and search results.
 *
 * @return array{title: string, text: string}
 */
function ghstore_listing_heading() {
	if ( is_search() ) {
		return array(
			/* translators: %s: search query. */
			'title' => sprintf( __( 'Results for “%s”', 'green-home-store' ), get_search_query() ),
			'text'  => '',
		);
	}

	if ( is_archive() ) {
		return array(
			'title' => wp_strip_all_tags( get_the_archive_title() ),
			'text'  => wp_strip_all_tags( get_the_archive_description() ),
		);
	}

	$posts_page = (int) get_option( 'page_for_posts' );

	return array(
		'title' => $posts_page ? get_the_title( $posts_page ) : __( 'News & solar tips', 'green-home-store' ),
		'text'  => '',
	);
}

/**
 * Plain-text summary of a post or product for listings: block-level tags
 * become spaces so list items don't run together.
 *
 * @param int $words Word limit.
 * @return string
 */
function ghstore_summary( $words = 30 ) {
	$text = preg_replace( '/<\/?(?:li|ul|ol|p|h[1-6]|div|br|tr|td|th|blockquote)\b[^>]*>/i', ' ', get_the_excerpt() );

	return wp_trim_words( wp_strip_all_tags( $text ), $words );
}

/**
 * Meta description and Open Graph tags for the home page and single
 * products/posts, unless an SEO plugin is handling them.
 */
function ghstore_meta_tags() {
	if ( defined( 'WPSEO_VERSION' ) || defined( 'RANK_MATH_VERSION' ) || defined( 'SEOPRESS_VERSION' ) || defined( 'AIOSEO_VERSION' ) ) {
		return;
	}

	$description = '';
	$image       = '';
	$url         = '';

	if ( is_front_page() ) {
		$description = ghstore_mod( 'hero_text' );
		$url         = home_url( '/' );
	} elseif ( is_singular() ) {
		$post = get_queried_object();
		$url  = get_permalink( $post );
		if ( function_exists( 'wc_get_product' ) && 'product' === $post->post_type ) {
			$product     = wc_get_product( $post );
			$description = $product ? $product->get_short_description() : '';
			if ( $product && ! $description ) {
				$description = $product->get_description();
			}
		} else {
			$description = has_excerpt( $post ) ? get_the_excerpt( $post ) : $post->post_content;
		}
		$image = get_the_post_thumbnail_url( $post, 'large' );
	} else {
		return;
	}

	$description = wp_trim_words( wp_strip_all_tags( strip_shortcodes( (string) $description ) ), 30, '…' );
	if ( ! $image ) {
		$image = get_template_directory_uri() . '/assets/images/logo.webp';
	}

	echo '<meta name="description" content="' . esc_attr( $description ) . '">' . "\n";
	echo '<meta property="og:site_name" content="' . esc_attr( get_bloginfo( 'name' ) ) . '">' . "\n";
	echo '<meta property="og:type" content="' . ( is_front_page() ? 'website' : 'article' ) . '">' . "\n";
	echo '<meta property="og:title" content="' . esc_attr( wp_get_document_title() ) . '">' . "\n";
	echo '<meta property="og:description" content="' . esc_attr( $description ) . '">' . "\n";
	echo '<meta property="og:url" content="' . esc_url( $url ) . '">' . "\n";
	echo '<meta property="og:image" content="' . esc_url( $image ) . '">' . "\n";
	echo '<meta name="twitter:card" content="summary_large_image">' . "\n";
}
add_action( 'wp_head', 'ghstore_meta_tags', 2 );
