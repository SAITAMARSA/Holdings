<?php
/**
 * Comments list and form.
 *
 * @package PixelPort
 */

if ( post_password_required() ) {
	return;
}
?>
<div id="comments" class="comments-area">
	<?php if ( have_comments() ) : ?>
		<h2 class="comments-title">
			<?php
			$pixelport_count = get_comments_number();
			printf(
				/* translators: %s: number of comments. */
				esc_html( _n( '%s comment', '%s comments', $pixelport_count, 'pixelport' ) ),
				esc_html( number_format_i18n( $pixelport_count ) )
			);
			?>
		</h2>

		<ol class="comment-list">
			<?php
			wp_list_comments(
				array(
					'style'       => 'ol',
					'short_ping'  => true,
					'avatar_size' => 40,
				)
			);
			?>
		</ol>

		<?php the_comments_navigation(); ?>

		<?php if ( ! comments_open() ) : ?>
			<p class="no-comments"><?php esc_html_e( 'Comments are closed.', 'pixelport' ); ?></p>
		<?php endif; ?>
	<?php endif; ?>

	<?php comment_form(); ?>
</div>
