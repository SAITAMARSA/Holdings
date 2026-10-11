<?php
/**
 * Customizer settings: hero copy, home sections, colours and footer.
 *
 * Every text setting is declared once in pixelport_text_settings(); read it
 * back anywhere with pixelport_mod( 'key' ).
 *
 * @package PixelPort
 */

defined( 'ABSPATH' ) || exit;

/**
 * Text settings shown in the Customizer, keyed without the "pixelport_" prefix.
 *
 * @return array<string, array{section: string, label: string, default: string, type?: string}>
 */
function pixelport_text_settings() {
	return array(
		'hero_eyebrow'         => array(
			'section' => 'pixelport_hero',
			'label'   => __( 'Eyebrow (small label above the heading)', 'pixelport' ),
			'default' => __( 'New season · Patch 4.2 live', 'pixelport' ),
		),
		'hero_title'           => array(
			'section' => 'pixelport_hero',
			'label'   => __( 'Heading', 'pixelport' ),
			'default' => __( 'Your next favourite game is one click away.', 'pixelport' ),
		),
		'hero_text'            => array(
			'section' => 'pixelport_hero',
			'label'   => __( 'Intro text', 'pixelport' ),
			'default' => __( 'PixelPort stocks the titles worth your weekend — scored by people who actually finish them — and ships a browser arcade you can jump into right now.', 'pixelport' ),
			'type'    => 'textarea',
		),
		'hero_primary_label'   => array(
			'section' => 'pixelport_hero',
			'label'   => __( 'Main button text', 'pixelport' ),
			'default' => __( 'Browse the shop', 'pixelport' ),
		),
		'hero_primary_url'     => array(
			'section' => 'pixelport_hero',
			'label'   => __( 'Main button link (leave empty for the shop page)', 'pixelport' ),
			'default' => '',
			'type'    => 'url',
		),
		'hero_secondary_label' => array(
			'section' => 'pixelport_hero',
			'label'   => __( 'Second button text', 'pixelport' ),
			'default' => __( 'Play the arcade', 'pixelport' ),
		),
		'hero_secondary_url'   => array(
			'section' => 'pixelport_hero',
			'label'   => __( 'Second button link (leave empty for your Arcade page)', 'pixelport' ),
			'default' => '',
			'type'    => 'url',
		),
		'stat_1_value'         => array(
			'section' => 'pixelport_hero',
			'label'   => __( 'Stat 1 number', 'pixelport' ),
			'default' => '8',
		),
		'stat_1_label'         => array(
			'section' => 'pixelport_hero',
			'label'   => __( 'Stat 1 label', 'pixelport' ),
			'default' => __( 'curated titles', 'pixelport' ),
		),
		'stat_2_value'         => array(
			'section' => 'pixelport_hero',
			'label'   => __( 'Stat 2 number', 'pixelport' ),
			'default' => '120h',
		),
		'stat_2_label'         => array(
			'section' => 'pixelport_hero',
			'label'   => __( 'Stat 2 label', 'pixelport' ),
			'default' => __( 'played for reviews', 'pixelport' ),
		),
		'stat_3_value'         => array(
			'section' => 'pixelport_hero',
			'label'   => __( 'Stat 3 number', 'pixelport' ),
			'default' => '1',
		),
		'stat_3_label'         => array(
			'section' => 'pixelport_hero',
			'label'   => __( 'Stat 3 label', 'pixelport' ),
			'default' => __( 'game playable here', 'pixelport' ),
		),
		'products_title'       => array(
			'section' => 'pixelport_home',
			'label'   => __( 'Products heading', 'pixelport' ),
			'default' => __( 'Top picks right now', 'pixelport' ),
		),
		'products_text'        => array(
			'section' => 'pixelport_home',
			'label'   => __( 'Products intro', 'pixelport' ),
			'default' => __( 'Hand-picked titles from the shop.', 'pixelport' ),
		),
		'news_title'           => array(
			'section' => 'pixelport_home',
			'label'   => __( 'News heading', 'pixelport' ),
			'default' => __( 'Latest from the desk', 'pixelport' ),
		),
		'news_text'            => array(
			'section' => 'pixelport_home',
			'label'   => __( 'News intro', 'pixelport' ),
			'default' => __( 'Patch notes, release dates and the occasional rant.', 'pixelport' ),
		),
		'footer_text'          => array(
			'section' => 'pixelport_footer',
			'label'   => __( 'Footer note (shown after the copyright line)', 'pixelport' ),
			'default' => '',
		),
	);
}

/**
 * Where the home page pulls its products from.
 *
 * @return array<string, string>
 */
function pixelport_product_sources() {
	return array(
		'featured'     => __( 'Featured products (star them in Products)', 'pixelport' ),
		'top_rated'    => __( 'Top rated', 'pixelport' ),
		'best_selling' => __( 'Best selling', 'pixelport' ),
		'on_sale'      => __( 'On sale', 'pixelport' ),
		'recent'       => __( 'Newest', 'pixelport' ),
	);
}

/**
 * Default values for the non-text settings.
 *
 * @return array<string, mixed>
 */
function pixelport_option_defaults() {
	return array(
		'accent'          => '#7c5cff',
		'accent_2'        => '#3ec7a8',
		'show_products'   => true,
		'products_source' => 'featured',
		'products_count'  => 4,
		'show_news'       => true,
	);
}

/**
 * Read a PixelPort theme setting, falling back to its default.
 *
 * @param string $key Setting key without the "pixelport_" prefix.
 * @return mixed
 */
function pixelport_mod( $key ) {
	$text     = pixelport_text_settings();
	$options  = pixelport_option_defaults();
	$fallback = isset( $text[ $key ] ) ? $text[ $key ]['default'] : ( isset( $options[ $key ] ) ? $options[ $key ] : '' );

	return get_theme_mod( 'pixelport_' . $key, $fallback );
}

/**
 * Register sections, settings and controls.
 *
 * @param WP_Customize_Manager $wp_customize Customizer instance.
 */
function pixelport_customize_register( $wp_customize ) {
	$wp_customize->add_panel(
		'pixelport',
		array(
			'title'    => __( 'PixelPort theme', 'pixelport' ),
			'priority' => 30,
		)
	);

	$wp_customize->add_section(
		'pixelport_hero',
		array(
			'title' => __( 'Home: hero', 'pixelport' ),
			'panel' => 'pixelport',
		)
	);
	$wp_customize->add_section(
		'pixelport_home',
		array(
			'title' => __( 'Home: products & news', 'pixelport' ),
			'panel' => 'pixelport',
		)
	);
	$wp_customize->add_section(
		'pixelport_footer',
		array(
			'title' => __( 'Footer', 'pixelport' ),
			'panel' => 'pixelport',
		)
	);

	foreach ( pixelport_text_settings() as $key => $field ) {
		$type     = isset( $field['type'] ) ? $field['type'] : 'text';
		$sanitize = 'sanitize_text_field';
		if ( 'textarea' === $type ) {
			$sanitize = 'sanitize_textarea_field';
		} elseif ( 'url' === $type ) {
			$sanitize = 'esc_url_raw';
		}

		$wp_customize->add_setting(
			'pixelport_' . $key,
			array(
				'default'           => $field['default'],
				'sanitize_callback' => $sanitize,
			)
		);
		$wp_customize->add_control(
			'pixelport_' . $key,
			array(
				'label'   => $field['label'],
				'section' => $field['section'],
				'type'    => $type,
			)
		);
	}

	$defaults = pixelport_option_defaults();

	$wp_customize->add_setting(
		'pixelport_show_products',
		array(
			'default'           => $defaults['show_products'],
			'sanitize_callback' => 'rest_sanitize_boolean',
		)
	);
	$wp_customize->add_control(
		'pixelport_show_products',
		array(
			'label'    => __( 'Show products on the home page', 'pixelport' ),
			'section'  => 'pixelport_home',
			'type'     => 'checkbox',
			'priority' => 1,
		)
	);

	$wp_customize->add_setting(
		'pixelport_products_source',
		array(
			'default'           => $defaults['products_source'],
			'sanitize_callback' => 'pixelport_sanitize_product_source',
		)
	);
	$wp_customize->add_control(
		'pixelport_products_source',
		array(
			'label'       => __( 'Which products to show', 'pixelport' ),
			'description' => __( 'If nothing matches, the newest products are shown instead.', 'pixelport' ),
			'section'     => 'pixelport_home',
			'type'        => 'select',
			'choices'     => pixelport_product_sources(),
			'priority'    => 2,
		)
	);

	$wp_customize->add_setting(
		'pixelport_products_count',
		array(
			'default'           => $defaults['products_count'],
			'sanitize_callback' => 'absint',
		)
	);
	$wp_customize->add_control(
		'pixelport_products_count',
		array(
			'label'       => __( 'How many products', 'pixelport' ),
			'section'     => 'pixelport_home',
			'type'        => 'number',
			'input_attrs' => array(
				'min' => 1,
				'max' => 24,
			),
			'priority'    => 3,
		)
	);

	$wp_customize->add_setting(
		'pixelport_show_news',
		array(
			'default'           => $defaults['show_news'],
			'sanitize_callback' => 'rest_sanitize_boolean',
		)
	);
	$wp_customize->add_control(
		'pixelport_show_news',
		array(
			'label'   => __( 'Show latest posts on the home page', 'pixelport' ),
			'section' => 'pixelport_home',
			'type'    => 'checkbox',
		)
	);

	$colors = array(
		'accent'   => __( 'Accent colour (buttons, links, highlights)', 'pixelport' ),
		'accent_2' => __( 'Second accent (scores, labels, glow)', 'pixelport' ),
	);
	foreach ( $colors as $key => $label ) {
		$wp_customize->add_setting(
			'pixelport_' . $key,
			array(
				'default'           => $defaults[ $key ],
				'sanitize_callback' => 'sanitize_hex_color',
			)
		);
		$wp_customize->add_control(
			new WP_Customize_Color_Control(
				$wp_customize,
				'pixelport_' . $key,
				array(
					'label'   => $label,
					'section' => 'colors',
				)
			)
		);
	}
}
add_action( 'customize_register', 'pixelport_customize_register' );

/**
 * Keep the product source to one of the known values.
 *
 * @param string $value Submitted value.
 * @return string
 */
function pixelport_sanitize_product_source( $value ) {
	return array_key_exists( $value, pixelport_product_sources() ) ? $value : 'featured';
}

/**
 * CSS custom properties for the chosen accent colours.
 *
 * @return string
 */
function pixelport_colors_css() {
	$defaults = pixelport_option_defaults();
	$accent   = sanitize_hex_color( pixelport_mod( 'accent' ) );
	$accent_2 = sanitize_hex_color( pixelport_mod( 'accent_2' ) );

	return sprintf(
		':root{--accent:%1$s;--accent-2:%2$s;}',
		$accent ? $accent : $defaults['accent'],
		$accent_2 ? $accent_2 : $defaults['accent_2']
	);
}
