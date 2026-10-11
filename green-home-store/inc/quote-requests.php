<?php
/**
 * Quote request form: renders the form, saves every request as a private
 * "Quote request" in the dashboard, and emails it to the shop.
 *
 * Saving first means a request is never lost when email delivery fails.
 *
 * @package GreenHomeStore
 */

defined( 'ABSPATH' ) || exit;

/**
 * Form fields.
 *
 * @return array<string, array{label: string, type: string, required: bool, autocomplete?: string}>
 */
function ghstore_quote_fields() {
	return array(
		'name'     => array(
			'label'        => __( 'Full name', 'green-home-store' ),
			'type'         => 'text',
			'required'     => true,
			'autocomplete' => 'name',
		),
		'email'    => array(
			'label'        => __( 'Email address', 'green-home-store' ),
			'type'         => 'email',
			'required'     => true,
			'autocomplete' => 'email',
		),
		'phone'    => array(
			'label'        => __( 'Phone number', 'green-home-store' ),
			'type'         => 'tel',
			'required'     => true,
			'autocomplete' => 'tel',
		),
		'city'     => array(
			'label'        => __( 'City / town', 'green-home-store' ),
			'type'         => 'text',
			'required'     => true,
			'autocomplete' => 'address-level2',
		),
		'interest' => array(
			'label'    => __( 'I’m interested in', 'green-home-store' ),
			'type'     => 'select',
			'required' => false,
		),
		'message'  => array(
			'label'    => __( 'Message', 'green-home-store' ),
			'type'     => 'textarea',
			'required' => true,
		),
	);
}

/**
 * Options for the "I'm interested in" field.
 *
 * @return string[]
 */
function ghstore_quote_interests() {
	return array(
		__( 'A complete solar kit', 'green-home-store' ),
		__( 'Inverter', 'green-home-store' ),
		__( 'Lithium batteries', 'green-home-store' ),
		__( 'Solar panels', 'green-home-store' ),
		__( 'Installation or maintenance', 'green-home-store' ),
		__( 'Something else', 'green-home-store' ),
	);
}

/**
 * Register the private "Quote request" post type.
 */
function ghstore_register_quote_post_type() {
	register_post_type(
		'ghstore_quote',
		array(
			'labels'        => array(
				'name'          => __( 'Quote requests', 'green-home-store' ),
				'singular_name' => __( 'Quote request', 'green-home-store' ),
				'menu_name'     => __( 'Quote requests', 'green-home-store' ),
				'all_items'     => __( 'All quote requests', 'green-home-store' ),
				'edit_item'     => __( 'Quote request', 'green-home-store' ),
				'search_items'  => __( 'Search quote requests', 'green-home-store' ),
				'not_found'     => __( 'No quote requests yet.', 'green-home-store' ),
			),
			'public'        => false,
			'show_ui'       => true,
			'show_in_menu'  => true,
			'show_in_rest'  => false,
			'menu_position' => 26,
			'menu_icon'     => 'dashicons-email-alt',
			'supports'      => array( 'title', 'editor' ),
			'map_meta_cap'  => true,
			'capabilities'  => array( 'create_posts' => 'do_not_allow' ),
		)
	);
}
add_action( 'init', 'ghstore_register_quote_post_type' );

/**
 * Render the quote form, with a status message after submitting.
 *
 * @return string
 */
function ghstore_quote_form() {
	$status = isset( $_GET['quote'] ) ? sanitize_key( wp_unslash( $_GET['quote'] ) ) : ''; // phpcs:ignore WordPress.Security.NonceVerification.Recommended -- display only.
	$item   = isset( $_GET['quote_item'] ) ? sanitize_text_field( wp_unslash( $_GET['quote_item'] ) ) : ''; // phpcs:ignore WordPress.Security.NonceVerification.Recommended -- display only.

	ob_start();

	if ( 'sent' === $status ) {
		?>
		<div class="form-notice is-success" role="status">
			<?php ghstore_icon_e( 'check' ); ?>
			<p><strong><?php esc_html_e( 'Thank you — your request has been sent.', 'green-home-store' ); ?></strong> <?php esc_html_e( 'We’ll get back to you within 24 hours.', 'green-home-store' ); ?></p>
		</div>
		<?php
	} elseif ( 'invalid' === $status ) {
		?>
		<div class="form-notice is-error" role="alert">
			<p><?php esc_html_e( 'Please fill in every required field with a valid email address, then send again.', 'green-home-store' ); ?></p>
		</div>
		<?php
	}
	?>
	<form class="quote-form" method="post" action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>">
		<input type="hidden" name="action" value="ghstore_quote">
		<input type="hidden" name="ghstore_ts" value="<?php echo esc_attr( (string) time() ); ?>">
		<input type="hidden" name="ghstore_redirect" value="<?php echo esc_url( remove_query_arg( array( 'quote', 'quote_item' ) ) ); ?>">
		<div class="hp-field" aria-hidden="true">
			<label><?php esc_html_e( 'Leave this field empty', 'green-home-store' ); ?> <input type="text" name="ghstore_website" tabindex="-1" autocomplete="off"></label>
		</div>

		<div class="form-grid">
			<?php foreach ( ghstore_quote_fields() as $key => $field ) : ?>
				<?php
				$id       = 'ghstore-' . $key;
				$is_wide  = in_array( $field['type'], array( 'textarea', 'select' ), true );
				$required = $field['required'] ? ' required' : '';
				$autofill = isset( $field['autocomplete'] ) ? ' autocomplete="' . esc_attr( $field['autocomplete'] ) . '"' : '';
				?>
				<p class="form-field<?php echo $is_wide ? ' is-wide' : ''; ?>">
					<label for="<?php echo esc_attr( $id ); ?>">
						<?php echo esc_html( $field['label'] ); ?>
						<?php if ( $field['required'] ) : ?>
							<span class="required" aria-hidden="true">*</span>
						<?php endif; ?>
					</label>
					<?php if ( 'textarea' === $field['type'] ) : ?>
						<textarea id="<?php echo esc_attr( $id ); ?>" name="ghstore_<?php echo esc_attr( $key ); ?>" rows="4" maxlength="2000"<?php echo $required; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- fixed string. ?>><?php echo $item ? esc_textarea( sprintf( /* translators: %s: product or kit name. */ __( 'I’d like a quote for: %s', 'green-home-store' ), $item ) ) : ''; ?></textarea>
					<?php elseif ( 'select' === $field['type'] ) : ?>
						<select id="<?php echo esc_attr( $id ); ?>" name="ghstore_<?php echo esc_attr( $key ); ?>">
							<?php foreach ( ghstore_quote_interests() as $option ) : ?>
								<option><?php echo esc_html( $option ); ?></option>
							<?php endforeach; ?>
						</select>
					<?php else : ?>
						<input id="<?php echo esc_attr( $id ); ?>" type="<?php echo esc_attr( $field['type'] ); ?>" name="ghstore_<?php echo esc_attr( $key ); ?>" maxlength="200"<?php echo $required . $autofill; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- escaped above. ?>>
					<?php endif; ?>
				</p>
			<?php endforeach; ?>
		</div>

		<button type="submit" class="btn btn-primary btn-block"><?php esc_html_e( 'Send my quote request', 'green-home-store' ); ?></button>
		<p class="form-small"><?php esc_html_e( 'We only use your details to reply to this request.', 'green-home-store' ); ?></p>
	</form>
	<?php

	return ob_get_clean();
}
add_shortcode( 'ghstore_quote_form', 'ghstore_quote_form' );


/**
 * Handle a submitted quote request.
 *
 * Public contact forms carry no nonce on purpose: anyone may submit one, it
 * grants no privilege, and cached pages would serve expired nonces and lose
 * real leads. Spam is filtered with a hidden honeypot field and a minimum
 * fill-in time instead.
 */
function ghstore_handle_quote() {
	// phpcs:disable WordPress.Security.NonceVerification.Missing -- see function docblock.
	$redirect = home_url( '/' );
	if ( isset( $_POST['ghstore_redirect'] ) ) {
		$redirect = wp_validate_redirect( esc_url_raw( wp_unslash( $_POST['ghstore_redirect'] ) ), home_url( '/' ) );
	}

	$started  = isset( $_POST['ghstore_ts'] ) ? absint( $_POST['ghstore_ts'] ) : 0;
	$is_bot   = ! empty( $_POST['ghstore_website'] ) || ( $started && time() - $started < 3 );
	$data     = array();
	$is_valid = true;

	foreach ( ghstore_quote_fields() as $key => $field ) {
		$raw = isset( $_POST[ 'ghstore_' . $key ] ) ? wp_unslash( $_POST[ 'ghstore_' . $key ] ) : ''; // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized -- sanitized below.

		if ( 'email' === $field['type'] ) {
			$value = sanitize_email( $raw );
		} elseif ( 'textarea' === $field['type'] ) {
			$value = mb_substr( sanitize_textarea_field( $raw ), 0, 2000 );
		} else {
			$value = mb_substr( sanitize_text_field( $raw ), 0, 200 );
		}

		if ( 'interest' === $key && ! in_array( $value, ghstore_quote_interests(), true ) ) {
			$value = '';
		}

		if ( $field['required'] && '' === $value ) {
			$is_valid = false;
		}
		$data[ $key ] = $value;
	}
	// phpcs:enable

	if ( ! is_email( $data['email'] ) ) {
		$is_valid = false;
	}

	if ( $is_bot ) {
		// Look like success so bots don't retry.
		ghstore_quote_redirect( $redirect, 'sent' );
	}
	if ( ! $is_valid ) {
		ghstore_quote_redirect( $redirect, 'invalid' );
	}

	$post_id = wp_insert_post(
		array(
			'post_type'    => 'ghstore_quote',
			'post_status'  => 'private',
			'post_title'   => $data['name'] . ' — ' . $data['city'],
			'post_content' => $data['message'],
		)
	);
	if ( $post_id ) {
		foreach ( array( 'email', 'phone', 'city', 'interest' ) as $key ) {
			update_post_meta( $post_id, '_ghstore_' . $key, $data[ $key ] );
		}
	}

	$to = ghstore_mod( 'quote_email' );
	if ( ! is_email( $to ) ) {
		$to = is_email( ghstore_mod( 'email' ) ) ? ghstore_mod( 'email' ) : get_option( 'admin_email' );
	}

	$lines = array();
	foreach ( ghstore_quote_fields() as $key => $field ) {
		if ( 'message' !== $key ) {
			$lines[] = $field['label'] . ': ' . $data[ $key ];
		}
	}
	$lines[] = '';
	$lines[] = $data['message'];
	if ( $post_id ) {
		$lines[] = '';
		/* translators: %s: admin URL of the saved request. */
		$lines[] = sprintf( __( 'Saved in your dashboard: %s', 'green-home-store' ), admin_url( 'post.php?post=' . $post_id . '&action=edit' ) );
	}

	$reply_name = trim( str_replace( array( '"', '<', '>', ',' ), '', $data['name'] ) );
	wp_mail(
		$to,
		/* translators: %s: customer name. */
		sprintf( __( 'New quote request from %s', 'green-home-store' ), $data['name'] ),
		implode( "\n", $lines ),
		array( 'Reply-To: ' . $reply_name . ' <' . $data['email'] . '>' )
	);

	ghstore_quote_redirect( $redirect, 'sent' );
}
add_action( 'admin_post_nopriv_ghstore_quote', 'ghstore_handle_quote' );
add_action( 'admin_post_ghstore_quote', 'ghstore_handle_quote' );

/**
 * Send the visitor back to the form with a status.
 *
 * @param string $url    Page the form was on.
 * @param string $status "sent" or "invalid".
 */
function ghstore_quote_redirect( $url, $status ) {
	wp_safe_redirect( add_query_arg( 'quote', $status, $url ) . '#quote' );
	exit;
}

/**
 * Contact columns in the Quote requests list.
 *
 * @param array $columns Columns.
 * @return array
 */
function ghstore_quote_columns( $columns ) {
	$date = $columns['date'];
	unset( $columns['date'] );

	return array_merge(
		$columns,
		array(
			'ghstore_phone'    => __( 'Phone', 'green-home-store' ),
			'ghstore_email'    => __( 'Email', 'green-home-store' ),
			'ghstore_interest' => __( 'Interested in', 'green-home-store' ),
			'date'             => $date,
		)
	);
}
add_filter( 'manage_ghstore_quote_posts_columns', 'ghstore_quote_columns' );

/**
 * Fill the contact columns.
 *
 * @param string $column  Column key.
 * @param int    $post_id Post ID.
 */
function ghstore_quote_column_content( $column, $post_id ) {
	$value = get_post_meta( $post_id, '_' . $column, true );

	if ( 'ghstore_email' === $column && $value ) {
		echo '<a href="' . esc_url( 'mailto:' . $value ) . '">' . esc_html( $value ) . '</a>';
	} elseif ( 'ghstore_phone' === $column && $value ) {
		echo '<a href="' . esc_url( 'tel:' . preg_replace( '/[^\d+]+/', '', $value ) ) . '">' . esc_html( $value ) . '</a>';
	} elseif ( in_array( $column, array( 'ghstore_interest' ), true ) ) {
		echo esc_html( $value );
	}
}
add_action( 'manage_ghstore_quote_posts_custom_column', 'ghstore_quote_column_content', 10, 2 );

/**
 * Contact details box on a quote request's edit screen.
 */
function ghstore_quote_meta_box() {
	add_meta_box(
		'ghstore-quote-details',
		__( 'Contact details', 'green-home-store' ),
		'ghstore_quote_meta_box_html',
		'ghstore_quote',
		'side',
		'high'
	);
}
add_action( 'add_meta_boxes', 'ghstore_quote_meta_box' );

/**
 * Render the contact details box.
 *
 * @param WP_Post $post Quote request.
 */
function ghstore_quote_meta_box_html( $post ) {
	$labels = array(
		'email'    => __( 'Email', 'green-home-store' ),
		'phone'    => __( 'Phone', 'green-home-store' ),
		'city'     => __( 'City / town', 'green-home-store' ),
		'interest' => __( 'Interested in', 'green-home-store' ),
	);

	echo '<dl>';
	foreach ( $labels as $key => $label ) {
		$value = get_post_meta( $post->ID, '_ghstore_' . $key, true );
		echo '<dt><strong>' . esc_html( $label ) . '</strong></dt><dd style="margin:0 0 8px">';
		ghstore_quote_column_content( 'ghstore_' . $key, $post->ID );
		if ( 'city' === $key ) {
			echo esc_html( $value );
		}
		echo '</dd>';
	}
	echo '</dl>';
}
