<?php
/**
 * Home: closing call to action.
 *
 * @package GreenHomeStore
 */

$ghstore_whatsapp = ghstore_whatsapp_url();
?>
<section class="cta-band">
	<div class="wrap cta-inner">
		<div>
			<h2><?php esc_html_e( 'Ready to Go Solar?', 'green-home-store' ); ?></h2>
			<p><?php esc_html_e( 'Join thousands of South African homes enjoying clean, affordable energy. Start your free consultation today!', 'green-home-store' ); ?></p>
		</div>
		<div class="cta-actions">
			<?php if ( ghstore_quote_url() ) : ?>
				<a class="btn btn-primary btn-lg" href="<?php echo esc_url( ghstore_quote_url() ); ?>"><?php esc_html_e( 'Get Your Free Quote Now', 'green-home-store' ); ?></a>
			<?php endif; ?>
			<?php if ( $ghstore_whatsapp ) : ?>
				<a class="btn btn-outline-light btn-lg" href="<?php echo esc_url( $ghstore_whatsapp ); ?>" target="_blank" rel="noopener"><?php ghstore_icon_e( 'whatsapp', 18 ); ?> <?php esc_html_e( 'WhatsApp us', 'green-home-store' ); ?></a>
			<?php endif; ?>
		</div>
	</div>
</section>
