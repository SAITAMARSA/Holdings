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

/** Submissions allowed per visitor IP within GHSTORE_QUOTE_RATE_WINDOW. */
const GHSTORE_QUOTE_RATE_LIMIT = 5;

/** Length of the rate-limit window, in seconds. */
const GHSTORE_QUOTE_RATE_WINDOW = 10 * MINUTE_IN_SECONDS;

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
 *
 * Capabilities follow pages, so administrators, editors and shop managers
 * can read requests while authors and contributors don't see the menu.
 */
function ghstore_register_quote_post_type() {
	register_post_type(
		'ghstore_quote',
		array(
			'labels'              => array(
				'name'          => __( 'Quote requests', 'green-home-store' ),
				'singular_name' => __( 'Quote request', 'green-home-store' ),
				'menu_name'     => __( 'Quote requests', 'green-home-store' ),
				'all_items'     => __( 'All quote requests', 'green-home-store' ),
				'edit_item'     => __( 'Quote request', 'green-home-store' ),
				'search_items'  => __( 'Search quote requests', 'green-home-store' ),
				'not_found'     => __( 'No quote requests yet.', 'green-home-store' ),
			),
			'public'              => false,
			'publicly_queryable'  => false,
			'exclude_from_search' => true,
			'show_ui'             => true,
			'show_in_menu'        => true,
			'show_in_rest'        => false,
			'rewrite'             => false,
			'query_var'           => false,
			'menu_position'       => 26,
			'menu_icon'           => 'dashicons-email-alt',
			'supports'            => array( 'title', 'editor' ),
			'capability_type'     => 'page',
			'map_meta_cap'        => true,
			'capabilities'        => array( 'create_posts' => 'do_not_allow' ),
		)
	);
}
add_action( 'init', 'ghstore_register_quote_post_type' );

/**
 * A string value from a request array, or '' when missing or not a string
 * (arrays posted as field[]= would otherwise reach string functions).
 *
 * @param array  $source Request array, already unslashed.
 * @param string $key    Key.
 * @return string
 */
function ghstore_request_string( $source, $key ) {
	return isset( $source[ $key ] ) && is_string( $source[ $key ] ) ? $source[ $key ] : '';
}

/**
 * Render the quote form, with a status message after submitting.
 *
 * @return string
 */
function ghstore_quote_form() {
	// phpcs:disable WordPress.Security.NonceVerification.Recommended -- display only; every value is sanitised.
	$query    = wp_unslash( $_GET );
	$status   = sanitize_key( ghstore_request_string( $query, 'quote' ) );
	$item     = sanitize_text_field( ghstore_request_string( $query, 'quote_item' ) );
	$interest = sanitize_text_field( ghstore_request_string( $query, 'quote_interest' ) );
	$token    = preg_replace( '/[^a-z0-9]/', '', strtolower( ghstore_request_string( $query, 'qt' ) ) );
	// phpcs:enable

	$values = array();
	$errors = array();
	if ( 'invalid' === $status && $token ) {
		$draft = get_transient( 'ghstore_quote_draft_' . $token );
		if ( is_array( $draft ) ) {
			delete_transient( 'ghstore_quote_draft_' . $token );
			$errors = isset( $draft['_errors'] ) ? (array) $draft['_errors'] : array();
			unset( $draft['_errors'] );
			$values = $draft;
		}
	}
	if ( empty( $values['message'] ) && $item ) {
		/* translators: %s: product or kit name. */
		$values['message'] = sprintf( __( 'I’d like a quote for: %s', 'green-home-store' ), $item );
	}
	if ( empty( $values['interest'] ) && in_array( $interest, ghstore_quote_interests(), true ) ) {
		$values['interest'] = $interest;
	}

	$fields = ghstore_quote_fields();

	ob_start();
	?>
	<div class="quote-form-wrap" id="quote-form">
	<?php if ( 'sent' === $status ) : ?>
		<div class="form-notice is-success" role="status">
			<?php ghstore_icon_e( 'check' ); ?>
			<p><strong><?php esc_html_e( 'Thank you — your request has been sent.', 'green-home-store' ); ?></strong> <?php esc_html_e( 'We’ll get back to you within 24 hours.', 'green-home-store' ); ?></p>
		</div>
	<?php elseif ( 'invalid' === $status ) : ?>
		<div class="form-notice is-error" role="alert">
			<p>
				<?php
				$labels = array();
				foreach ( $errors as $error_key ) {
					if ( isset( $fields[ $error_key ] ) ) {
						$labels[] = $fields[ $error_key ]['label'];
					}
				}
				if ( $labels ) {
					/* translators: %s: comma-separated list of field names. */
					echo esc_html( sprintf( __( 'Please check: %s. Your other details have been kept.', 'green-home-store' ), implode( ', ', $labels ) ) );
				} else {
					esc_html_e( 'Please fill in every required field with a valid email address, then send again.', 'green-home-store' );
				}
				?>
			</p>
		</div>
	<?php elseif ( 'limited' === $status ) : ?>
		<div class="form-notice is-error" role="alert">
			<p>
				<?php esc_html_e( 'You’ve sent several requests in a short time. Please wait ten minutes before sending another, or contact us directly:', 'green-home-store' ); ?>
				<?php if ( ghstore_whatsapp_url() ) : ?>
					<a href="<?php echo esc_url( ghstore_whatsapp_url() ); ?>" target="_blank" rel="noopener"><?php esc_html_e( 'WhatsApp', 'green-home-store' ); ?></a>
				<?php endif; ?>
				<?php if ( ghstore_tel_url() ) : ?>
					<a href="<?php echo esc_url( ghstore_tel_url() ); ?>"><?php echo esc_html( ghstore_mod( 'phone' ) ); ?></a>
				<?php endif; ?>
			</p>
		</div>
	<?php endif; ?>

	<form class="quote-form" method="post" action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>" novalidate="">
		<input type="hidden" name="action" value="ghstore_quote">
		<input type="hidden" name="ghstore_js" value="">
		<input type="hidden" name="ghstore_redirect" value="<?php echo esc_url( remove_query_arg( array( 'quote', 'quote_item', 'quote_interest', 'qt' ) ) ); ?>">
		<div class="hp-field" aria-hidden="true">
			<label><?php esc_html_e( 'Leave this field empty', 'green-home-store' ); ?> <input type="text" name="ghstore_website" tabindex="-1" autocomplete="off"></label>
		</div>

		<div class="form-grid">
			<?php foreach ( $fields as $key => $field ) : ?>
				<?php
				$id       = 'ghstore-' . $key;
				$name     = 'ghstore_' . $key;
				$value    = isset( $values[ $key ] ) ? (string) $values[ $key ] : '';
				$is_wide  = in_array( $field['type'], array( 'textarea', 'select' ), true );
				$invalid  = in_array( $key, $errors, true );
				$required = $field['required'] ? ' required' : '';
				$autofill = isset( $field['autocomplete'] ) ? ' autocomplete="' . esc_attr( $field['autocomplete'] ) . '"' : '';
				$aria     = $invalid ? ' aria-invalid="true"' : '';
				// Browsers accept "name@host" but WordPress requires a dot in the domain; ask for one up front.
				$extra = 'email' === $field['type'] ? ' pattern="[^@\s]+@[^@\s]+\.[^@\s]{2,}" title="' . esc_attr__( 'Please include the full address, e.g. name@example.com', 'green-home-store' ) . '"' : '';
				?>
				<p class="form-field<?php echo $is_wide ? ' is-wide' : ''; ?><?php echo $invalid ? ' is-invalid' : ''; ?>">
					<label for="<?php echo esc_attr( $id ); ?>">
						<?php echo esc_html( $field['label'] ); ?>
						<?php if ( $field['required'] ) : ?>
							<span class="required" aria-hidden="true">*</span>
						<?php endif; ?>
					</label>
					<?php if ( 'textarea' === $field['type'] ) : ?>
						<textarea id="<?php echo esc_attr( $id ); ?>" name="<?php echo esc_attr( $name ); ?>" rows="4" maxlength="2000"<?php echo $required . $aria; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- fixed strings. ?>><?php echo esc_textarea( $value ); ?></textarea>
					<?php elseif ( 'select' === $field['type'] ) : ?>
						<select id="<?php echo esc_attr( $id ); ?>" name="<?php echo esc_attr( $name ); ?>">
							<option value=""><?php esc_html_e( 'Please choose…', 'green-home-store' ); ?></option>
							<?php foreach ( ghstore_quote_interests() as $option ) : ?>
								<option<?php selected( $option, $value ); ?>><?php echo esc_html( $option ); ?></option>
							<?php endforeach; ?>
						</select>
					<?php else : ?>
						<input id="<?php echo esc_attr( $id ); ?>" type="<?php echo esc_attr( $field['type'] ); ?>" name="<?php echo esc_attr( $name ); ?>" value="<?php echo esc_attr( $value ); ?>" maxlength="200"<?php echo $required . $autofill . $aria . $extra; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- escaped above. ?>>
					<?php endif; ?>
				</p>
			<?php endforeach; ?>
		</div>

		<button type="submit" class="btn btn-primary btn-block"><?php esc_html_e( 'Send my quote request', 'green-home-store' ); ?></button>
		<p class="form-small"><?php esc_html_e( 'We only use your details to reply to this request.', 'green-home-store' ); ?></p>
	</form>
	</div>
	<?php

	return ob_get_clean();
}
add_shortcode( 'ghstore_quote_form', 'ghstore_quote_form' );

/**
 * The visitor's IP address, honouring Cloudflare / proxy headers when present.
 *
 * Only used to slow down floods, so a spoofed header costs nothing.
 *
 * @return string Empty when unknown.
 */
function ghstore_client_ip() {
	foreach ( array( 'HTTP_CF_CONNECTING_IP', 'HTTP_X_FORWARDED_FOR', 'REMOTE_ADDR' ) as $key ) {
		if ( empty( $_SERVER[ $key ] ) || ! is_string( $_SERVER[ $key ] ) ) {
			continue;
		}
		$parts     = explode( ',', sanitize_text_field( wp_unslash( $_SERVER[ $key ] ) ) );
		$candidate = trim( $parts[0] );
		if ( filter_var( $candidate, FILTER_VALIDATE_IP ) ) {
			return $candidate;
		}
	}

	return '';
}

/**
 * Count this submission against the visitor's rate limit.
 *
 * @return bool False when the visitor has sent too many requests recently.
 */
function ghstore_quote_rate_allow() {
	$ip = ghstore_client_ip();
	if ( ! $ip ) {
		return true;
	}

	$key   = 'ghstore_qrl_' . md5( $ip );
	$count = (int) get_transient( $key );
	if ( $count >= GHSTORE_QUOTE_RATE_LIMIT ) {
		return false;
	}
	set_transient( $key, $count + 1, GHSTORE_QUOTE_RATE_WINDOW );

	return true;
}

/**
 * Handle a submitted quote request.
 *
 * Public contact forms carry no nonce on purpose: anyone may submit one, it
 * grants no privilege, and cached pages would serve expired nonces and lose
 * real leads. Abuse is limited by a hidden honeypot field, a per-IP rate
 * limit, and flagging submissions that didn't come through a browser.
 */
function ghstore_handle_quote() {
	// phpcs:disable WordPress.Security.NonceVerification.Missing -- see function docblock.
	$post = wp_unslash( $_POST ); // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized -- every value is sanitised before use.
	// phpcs:enable

	$redirect = wp_validate_redirect( esc_url_raw( ghstore_request_string( $post, 'ghstore_redirect' ) ), home_url( '/' ) );
	if ( ! $redirect ) {
		$redirect = home_url( '/' );
	}

	if ( '' !== ghstore_request_string( $post, 'ghstore_website' ) ) {
		// Honeypot filled in: look like success so bots don't retry.
		ghstore_quote_redirect( $redirect, 'sent' );
	}

	$data   = array();
	$errors = array();
	foreach ( ghstore_quote_fields() as $key => $field ) {
		$raw = ghstore_request_string( $post, 'ghstore_' . $key );

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
			$errors[] = $key;
		}
		$data[ $key ] = $value;
	}
	if ( ! in_array( 'email', $errors, true ) && ! is_email( $data['email'] ) ) {
		$errors[] = 'email';
	}

	if ( $errors ) {
		// Keep what the visitor typed for the re-rendered form.
		$token = strtolower( wp_generate_password( 20, false, false ) );
		set_transient( 'ghstore_quote_draft_' . $token, $data + array( '_errors' => $errors ), 10 * MINUTE_IN_SECONDS );
		ghstore_quote_redirect( $redirect, 'invalid', array( 'qt' => $token ) );
	}

	// Only complete submissions count against the limit, so typos don't.
	if ( ! ghstore_quote_rate_allow() ) {
		ghstore_quote_redirect( $redirect, 'limited' );
	}

	$flagged = '1' !== ghstore_request_string( $post, 'ghstore_js' );

	$post_id = wp_insert_post(
		array(
			'post_type'    => 'ghstore_quote',
			'post_status'  => 'private',
			'post_title'   => ( $flagged ? __( '[Check]', 'green-home-store' ) . ' ' : '' ) . $data['name'] . ' — ' . $data['city'],
			'post_content' => $data['message'],
		)
	);
	if ( $post_id && ! is_wp_error( $post_id ) ) {
		foreach ( array( 'email', 'phone', 'city', 'interest' ) as $key ) {
			update_post_meta( $post_id, '_ghstore_' . $key, $data[ $key ] );
		}
		if ( $flagged ) {
			update_post_meta( $post_id, '_ghstore_flagged', 1 );
		}
	} else {
		$post_id = 0;
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
	if ( $flagged ) {
		$lines[] = '';
		$lines[] = __( 'Note: this was sent without a normal browser, so it may be automated.', 'green-home-store' );
	}
	if ( $post_id ) {
		$lines[] = '';
		/* translators: %s: admin URL of the saved request. */
		$lines[] = sprintf( __( 'Saved in your dashboard: %s', 'green-home-store' ), admin_url( 'post.php?post=' . $post_id . '&action=edit' ) );
	}

	$reply_name = trim( str_replace( array( '"', '<', '>', ',' ), '', $data['name'] ) );

	add_action( 'wp_mail_failed', 'ghstore_note_mail_failure' );
	$sent = wp_mail(
		$to,
		/* translators: %s: customer name. */
		sprintf( __( 'New quote request from %s', 'green-home-store' ), $data['name'] ),
		implode( "\n", $lines ),
		array( 'Reply-To: ' . $reply_name . ' <' . $data['email'] . '>' )
	);
	remove_action( 'wp_mail_failed', 'ghstore_note_mail_failure' );
	if ( $sent ) {
		delete_option( 'ghstore_mail_failed' );
	}

	ghstore_quote_redirect( $redirect, 'sent' );
}
add_action( 'admin_post_nopriv_ghstore_quote', 'ghstore_handle_quote' );
add_action( 'admin_post_ghstore_quote', 'ghstore_handle_quote' );

/**
 * Remember that a quote email could not be sent, for the admin notice.
 *
 * @param WP_Error $error Mail error.
 */
function ghstore_note_mail_failure( $error ) {
	update_option(
		'ghstore_mail_failed',
		array(
			'time'    => time(),
			'message' => $error instanceof WP_Error ? $error->get_error_message() : '',
		),
		false
	);
}

/**
 * Warn in the dashboard while quote emails are failing.
 */
function ghstore_mail_failed_notice() {
	$failed = get_option( 'ghstore_mail_failed' );
	if ( ! $failed || ! current_user_can( 'edit_pages' ) ) {
		return;
	}

	$screen = get_current_screen();
	if ( ! $screen || ! in_array( $screen->id, array( 'dashboard', 'edit-ghstore_quote', 'ghstore_quote' ), true ) ) {
		return;
	}
	?>
	<div class="notice notice-error">
		<p>
			<strong><?php esc_html_e( 'Quote request emails are not being delivered.', 'green-home-store' ); ?></strong>
			<?php
			printf(
				/* translators: 1: date and time, 2: error message. */
				esc_html__( 'The last attempt failed on %1$s (%2$s). Requests are still saved under Quote requests. Installing an SMTP plugin such as WP Mail SMTP usually fixes this.', 'green-home-store' ),
				esc_html( wp_date( get_option( 'date_format' ) . ' ' . get_option( 'time_format' ), (int) $failed['time'] ) ),
				esc_html( $failed['message'] ? $failed['message'] : __( 'unknown error', 'green-home-store' ) )
			);
			?>
		</p>
	</div>
	<?php
}
add_action( 'admin_notices', 'ghstore_mail_failed_notice' );

/**
 * Send the visitor back to the form with a status.
 *
 * @param string $url    Page the form was on.
 * @param string $status "sent", "invalid" or "limited".
 * @param array  $extra  Extra query arguments.
 */
function ghstore_quote_redirect( $url, $status, $extra = array() ) {
	wp_safe_redirect( add_query_arg( array_merge( $extra, array( 'quote' => $status ) ), $url ) . '#quote-form' );
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
	$value = (string) get_post_meta( $post_id, '_' . $column, true );

	if ( 'ghstore_email' === $column && $value ) {
		echo '<a href="' . esc_url( 'mailto:' . $value ) . '">' . esc_html( $value ) . '</a>';
	} elseif ( 'ghstore_phone' === $column && $value ) {
		echo '<a href="' . esc_url( 'tel:' . preg_replace( '/[^\d+]+/', '', $value ) ) . '">' . esc_html( $value ) . '</a>';
	} else {
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
		'ghstore_email'    => __( 'Email', 'green-home-store' ),
		'ghstore_phone'    => __( 'Phone', 'green-home-store' ),
		'ghstore_city'     => __( 'City / town', 'green-home-store' ),
		'ghstore_interest' => __( 'Interested in', 'green-home-store' ),
	);

	echo '<dl>';
	foreach ( $labels as $column => $label ) {
		echo '<dt><strong>' . esc_html( $label ) . '</strong></dt><dd style="margin:0 0 8px">';
		ghstore_quote_column_content( $column, $post->ID );
		echo '</dd>';
	}
	echo '</dl>';

	if ( get_post_meta( $post->ID, '_ghstore_flagged', true ) ) {
		echo '<p><em>' . esc_html__( 'Sent without a normal browser — may be automated.', 'green-home-store' ) . '</em></p>';
	}
}
