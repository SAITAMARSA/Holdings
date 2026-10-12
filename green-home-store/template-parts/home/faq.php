<?php
/**
 * Home: frequently asked questions. Edit them under
 * Customize → Green Home theme → Home: FAQ & testimonials.
 *
 * @package GreenHomeStore
 */

$ghstore_faqs = ghstore_rows( ghstore_mod( 'faq_items' ), 2 );
if ( ! $ghstore_faqs ) {
	return;
}
?>
<section class="section section-alt" id="faq">
	<div class="wrap wrap-narrow">
		<?php
		ghstore_section_head(
			__( 'FAQ', 'green-home-store' ),
			__( 'Frequently Asked Questions', 'green-home-store' ),
			__( 'Find answers to common questions about our solar solutions.', 'green-home-store' )
		);
		?>
		<div class="faq-list">
			<?php foreach ( $ghstore_faqs as $ghstore_i => $ghstore_faq ) : ?>
				<details class="faq-item"<?php echo 0 === $ghstore_i ? ' open' : ''; ?>>
					<summary><?php echo esc_html( $ghstore_faq[0] ); ?></summary>
					<p><?php echo esc_html( $ghstore_faq[1] ); ?></p>
				</details>
			<?php endforeach; ?>
		</div>
	</div>
</section>
