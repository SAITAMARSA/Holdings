<?php
/**
 * Customizer: promo bar, hero, stats, contact details, home sections,
 * footer and brand colour.
 *
 * Text settings are declared once in ghstore_text_settings(); read any setting
 * with ghstore_mod( 'key' ).
 *
 * @package GreenHomeStore
 */

defined( 'ABSPATH' ) || exit;

/**
 * Text settings, keyed without the "ghstore_" prefix.
 *
 * @return array<string, array{section: string, label: string, default: string, type?: string, description?: string}>
 */
function ghstore_text_settings() {
	return array(
		'promo_text'           => array(
			'section' => 'ghstore_promo',
			'label'   => __( 'Promo bar message (leave empty to hide the bar)', 'green-home-store' ),
			'default' => __( 'Limited Time: Get R5,000 Cashback on Any DEYE Kit This Month', 'green-home-store' ),
		),
		'promo_link_text'      => array(
			'section' => 'ghstore_promo',
			'label'   => __( 'Promo bar link text', 'green-home-store' ),
			'default' => __( 'Claim Now', 'green-home-store' ),
		),
		'promo_url'            => array(
			'section' => 'ghstore_promo',
			'label'   => __( 'Promo bar link (leave empty for the quote form)', 'green-home-store' ),
			'default' => '',
			'type'    => 'url',
		),
		'hero_badge'           => array(
			'section' => 'ghstore_hero',
			'label'   => __( 'Badge above the heading', 'green-home-store' ),
			'default' => __( 'Trusted by 5,000+ Homes', 'green-home-store' ),
		),
		'hero_title'           => array(
			'section' => 'ghstore_hero',
			'label'   => __( 'Heading, first line', 'green-home-store' ),
			'default' => __( 'South Africa’s Trusted', 'green-home-store' ),
		),
		'hero_highlight'       => array(
			'section' => 'ghstore_hero',
			'label'   => __( 'Heading, green second line', 'green-home-store' ),
			'default' => __( 'Solar Energy Experts', 'green-home-store' ),
		),
		'hero_text'            => array(
			'section' => 'ghstore_hero',
			'label'   => __( 'Intro text', 'green-home-store' ),
			'default' => __( 'Reduce your electricity bill, protect yourself from load shedding, and power your home with reliable solar solutions.', 'green-home-store' ),
			'type'    => 'textarea',
		),
		'hero_primary_label'   => array(
			'section' => 'ghstore_hero',
			'label'   => __( 'Main button text', 'green-home-store' ),
			'default' => __( 'Get a Free Quote', 'green-home-store' ),
		),
		'hero_primary_url'     => array(
			'section' => 'ghstore_hero',
			'label'   => __( 'Main button link (leave empty for the quote form)', 'green-home-store' ),
			'default' => '',
			'type'    => 'url',
		),
		'hero_secondary_label' => array(
			'section' => 'ghstore_hero',
			'label'   => __( 'Second button text', 'green-home-store' ),
			'default' => __( 'Shop Products', 'green-home-store' ),
		),
		'hero_secondary_url'   => array(
			'section' => 'ghstore_hero',
			'label'   => __( 'Second button link (leave empty for the shop)', 'green-home-store' ),
			'default' => '',
			'type'    => 'url',
		),
		'ticker'               => array(
			'section'     => 'ghstore_hero',
			'label'       => __( 'Highlights strip under the hero', 'green-home-store' ),
			'description' => __( 'One per line. Leave empty to hide.', 'green-home-store' ),
			'default'     => implode(
				"\n",
				array(
					__( 'Load Shedding Protection', 'green-home-store' ),
					__( 'Save Up to 80% on Electricity', 'green-home-store' ),
					__( 'Up to 15-Year Warranty', 'green-home-store' ),
					__( 'DEYE Hybrid Inverters', 'green-home-store' ),
					__( 'COC Included With Every Install', 'green-home-store' ),
				)
			),
			'type'        => 'textarea',
		),
		'stat_1_value'         => array(
			'section' => 'ghstore_stats',
			'label'   => __( 'Stat 1 number', 'green-home-store' ),
			'default' => '5,000+',
		),
		'stat_1_label'         => array(
			'section' => 'ghstore_stats',
			'label'   => __( 'Stat 1 label', 'green-home-store' ),
			'default' => __( 'Homes Powered', 'green-home-store' ),
		),
		'stat_2_value'         => array(
			'section' => 'ghstore_stats',
			'label'   => __( 'Stat 2 number', 'green-home-store' ),
			'default' => '8,000+',
		),
		'stat_2_label'         => array(
			'section' => 'ghstore_stats',
			'label'   => __( 'Stat 2 label', 'green-home-store' ),
			'default' => __( 'Installations', 'green-home-store' ),
		),
		'stat_3_value'         => array(
			'section' => 'ghstore_stats',
			'label'   => __( 'Stat 3 number', 'green-home-store' ),
			'default' => '15',
		),
		'stat_3_label'         => array(
			'section' => 'ghstore_stats',
			'label'   => __( 'Stat 3 label', 'green-home-store' ),
			'default' => __( 'Years Experience', 'green-home-store' ),
		),
		'stat_4_value'         => array(
			'section' => 'ghstore_stats',
			'label'   => __( 'Stat 4 number', 'green-home-store' ),
			'default' => '98%',
		),
		'stat_4_label'         => array(
			'section' => 'ghstore_stats',
			'label'   => __( 'Stat 4 label', 'green-home-store' ),
			'default' => __( 'Satisfaction', 'green-home-store' ),
		),
		'phone'                => array(
			'section' => 'ghstore_contact',
			'label'   => __( 'Phone number (as shown)', 'green-home-store' ),
			'default' => '071 395 9721',
		),
		'whatsapp'             => array(
			'section'     => 'ghstore_contact',
			'label'       => __( 'WhatsApp number', 'green-home-store' ),
			'description' => __( 'International format without + or spaces, e.g. 27713959721. Leave empty to hide WhatsApp buttons.', 'green-home-store' ),
			'default'     => '27713959721',
		),
		'email'                => array(
			'section' => 'ghstore_contact',
			'label'   => __( 'Email address (shown on the site)', 'green-home-store' ),
			'default' => 'info@greenhomesystems.co.za',
			'type'    => 'email',
		),
		'quote_email'          => array(
			'section'     => 'ghstore_contact',
			'label'       => __( 'Send quote requests to', 'green-home-store' ),
			'description' => __( 'Leave empty to use the email address above. Every request is also saved under Quote requests in the dashboard.', 'green-home-store' ),
			'default'     => '',
			'type'        => 'email',
		),
		'location'             => array(
			'section' => 'ghstore_contact',
			'label'   => __( 'Location', 'green-home-store' ),
			'default' => __( 'Johannesburg, South Africa', 'green-home-store' ),
		),
		'service_area'         => array(
			'section' => 'ghstore_contact',
			'label'   => __( 'Service area', 'green-home-store' ),
			'default' => __( 'Serving all provinces', 'green-home-store' ),
		),
		'hours'                => array(
			'section'     => 'ghstore_contact',
			'label'       => __( 'Business hours', 'green-home-store' ),
			'description' => __( 'One line per day or range.', 'green-home-store' ),
			'default'     => implode(
				"\n",
				array(
					__( 'Monday – Friday: 8:00 AM – 5:00 PM', 'green-home-store' ),
					__( 'Saturday: 9:00 AM – 1:00 PM', 'green-home-store' ),
					__( 'Sunday: Closed', 'green-home-store' ),
				)
			),
			'type'        => 'textarea',
		),
		'footer_tagline'       => array(
			'section' => 'ghstore_footer',
			'label'   => __( 'Footer tagline', 'green-home-store' ),
			'default' => __( 'Powering homes. Empowering tomorrow.', 'green-home-store' ),
		),
	);
}

/**
 * Home page sections that can be switched off, in display order.
 *
 * @return array<string, string> Section slug => Customizer label.
 */
function ghstore_home_sections() {
	return array(
		'stats'        => __( 'Stats', 'green-home-store' ),
		'categories'   => __( 'Shop by category', 'green-home-store' ),
		'products'     => __( 'Featured products', 'green-home-store' ),
		'kits'         => __( 'Solar kit packages', 'green-home-store' ),
		'why'          => __( 'Why choose us', 'green-home-store' ),
		'steps'        => __( '4 simple steps', 'green-home-store' ),
		'services'     => __( 'Services', 'green-home-store' ),
		'testimonials' => __( 'Testimonials', 'green-home-store' ),
		'faq'          => __( 'FAQ', 'green-home-store' ),
		'quote'        => __( 'Contact & quote form', 'green-home-store' ),
	);
}

/**
 * Where the home page's featured products come from.
 *
 * @return array<string, string>
 */
function ghstore_product_sources() {
	return array(
		'featured'     => __( 'Featured products (star them in Products)', 'green-home-store' ),
		'best_selling' => __( 'Best selling', 'green-home-store' ),
		'on_sale'      => __( 'On sale', 'green-home-store' ),
		'top_rated'    => __( 'Top rated', 'green-home-store' ),
		'recent'       => __( 'Newest', 'green-home-store' ),
	);
}

/**
 * Defaults for the non-text settings.
 *
 * @return array<string, mixed>
 */
function ghstore_option_defaults() {
	$defaults = array(
		'primary'         => '#9acd32',
		'products_source' => 'featured',
		'products_count'  => 8,
	);
	foreach ( array_keys( ghstore_home_sections() ) as $section ) {
		$defaults[ 'show_' . $section ] = true;
	}

	return $defaults;
}

/**
 * Read a theme setting, falling back to its default.
 *
 * @param string $key Setting key without the "ghstore_" prefix.
 * @return mixed
 */
function ghstore_mod( $key ) {
	$text    = ghstore_text_settings();
	$options = ghstore_option_defaults();

	if ( isset( $text[ $key ] ) ) {
		$fallback = $text[ $key ]['default'];
	} elseif ( isset( $options[ $key ] ) ) {
		$fallback = $options[ $key ];
	} else {
		$fallback = '';
	}

	return get_theme_mod( 'ghstore_' . $key, $fallback );
}

/**
 * Register panel, sections, settings and controls.
 *
 * @param WP_Customize_Manager $wp_customize Customizer instance.
 */
function ghstore_customize_register( $wp_customize ) {
	$wp_customize->add_panel(
		'ghstore',
		array(
			'title'    => __( 'Green Home theme', 'green-home-store' ),
			'priority' => 30,
		)
	);

	$sections = array(
		'ghstore_promo'   => __( 'Promo bar', 'green-home-store' ),
		'ghstore_hero'    => __( 'Home: hero', 'green-home-store' ),
		'ghstore_stats'   => __( 'Home: stats', 'green-home-store' ),
		'ghstore_home'    => __( 'Home: sections & products', 'green-home-store' ),
		'ghstore_contact' => __( 'Contact details & quotes', 'green-home-store' ),
		'ghstore_footer'  => __( 'Footer', 'green-home-store' ),
	);
	foreach ( $sections as $id => $title ) {
		$wp_customize->add_section(
			$id,
			array(
				'title' => $title,
				'panel' => 'ghstore',
			)
		);
	}

	foreach ( ghstore_text_settings() as $key => $field ) {
		$type      = isset( $field['type'] ) ? $field['type'] : 'text';
		$sanitizer = array(
			'textarea' => 'sanitize_textarea_field',
			'url'      => 'esc_url_raw',
			'email'    => 'sanitize_email',
		);

		$wp_customize->add_setting(
			'ghstore_' . $key,
			array(
				'default'           => $field['default'],
				'sanitize_callback' => isset( $sanitizer[ $type ] ) ? $sanitizer[ $type ] : 'sanitize_text_field',
			)
		);
		$wp_customize->add_control(
			'ghstore_' . $key,
			array(
				'label'       => $field['label'],
				'description' => isset( $field['description'] ) ? $field['description'] : '',
				'section'     => $field['section'],
				'type'        => $type,
			)
		);
	}

	$defaults = ghstore_option_defaults();

	$wp_customize->add_setting(
		'ghstore_products_source',
		array(
			'default'           => $defaults['products_source'],
			'sanitize_callback' => 'ghstore_sanitize_product_source',
		)
	);
	$wp_customize->add_control(
		'ghstore_products_source',
		array(
			'label'       => __( 'Featured products: which ones', 'green-home-store' ),
			'description' => __( 'If nothing matches, the newest products are shown instead.', 'green-home-store' ),
			'section'     => 'ghstore_home',
			'type'        => 'select',
			'choices'     => ghstore_product_sources(),
		)
	);

	$wp_customize->add_setting(
		'ghstore_products_count',
		array(
			'default'           => $defaults['products_count'],
			'sanitize_callback' => 'absint',
		)
	);
	$wp_customize->add_control(
		'ghstore_products_count',
		array(
			'label'       => __( 'Featured products: how many', 'green-home-store' ),
			'section'     => 'ghstore_home',
			'type'        => 'number',
			'input_attrs' => array(
				'min' => 1,
				'max' => 24,
			),
		)
	);

	foreach ( ghstore_home_sections() as $section => $label ) {
		$wp_customize->add_setting(
			'ghstore_show_' . $section,
			array(
				'default'           => true,
				'sanitize_callback' => 'rest_sanitize_boolean',
			)
		);
		$wp_customize->add_control(
			'ghstore_show_' . $section,
			array(
				/* translators: %s: home page section name. */
				'label'   => sprintf( __( 'Show: %s', 'green-home-store' ), $label ),
				'section' => 'ghstore_home',
				'type'    => 'checkbox',
			)
		);
	}

	$wp_customize->add_setting(
		'ghstore_primary',
		array(
			'default'           => $defaults['primary'],
			'sanitize_callback' => 'sanitize_hex_color',
		)
	);
	$wp_customize->add_control(
		new WP_Customize_Color_Control(
			$wp_customize,
			'ghstore_primary',
			array(
				'label'   => __( 'Brand green (buttons, highlights)', 'green-home-store' ),
				'section' => 'colors',
			)
		)
	);
}
add_action( 'customize_register', 'ghstore_customize_register' );

/**
 * Keep the product source to a known value.
 *
 * @param string $value Submitted value.
 * @return string
 */
function ghstore_sanitize_product_source( $value ) {
	return array_key_exists( $value, ghstore_product_sources() ) ? $value : 'featured';
}

/**
 * CSS custom property for the chosen brand colour.
 *
 * @return string
 */
function ghstore_colors_css() {
	$primary = sanitize_hex_color( ghstore_mod( 'primary' ) );
	if ( ! $primary ) {
		$defaults = ghstore_option_defaults();
		$primary  = $defaults['primary'];
	}

	return ':root{--primary:' . $primary . ';}';
}
