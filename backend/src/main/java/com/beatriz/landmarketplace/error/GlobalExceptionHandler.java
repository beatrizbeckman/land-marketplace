package com.beatriz.landmarketplace.error;

import java.util.List;

import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.WebRequest;
import org.springframework.web.servlet.mvc.method.annotation.ResponseEntityExceptionHandler;

import com.beatriz.landmarketplace.auth.EmailAlreadyRegisteredException;
import com.beatriz.landmarketplace.auth.InvalidCredentialsException;
import com.beatriz.landmarketplace.land.InvalidGeometryException;
import com.beatriz.landmarketplace.land.InvalidSearchException;
import com.beatriz.landmarketplace.land.LandOverlapException;

@RestControllerAdvice
public class GlobalExceptionHandler extends ResponseEntityExceptionHandler {

	record FieldMessage(String field, String message) {
	}

	@ExceptionHandler(LandOverlapException.class)
	ProblemDetail handleLandOverlap(LandOverlapException exception) {
		return ProblemDetail.forStatusAndDetail(HttpStatus.CONFLICT, exception.getMessage());
	}

	@ExceptionHandler(EmailAlreadyRegisteredException.class)
	ProblemDetail handleEmailAlreadyRegistered(EmailAlreadyRegisteredException exception) {
		return ProblemDetail.forStatusAndDetail(HttpStatus.CONFLICT, exception.getMessage());
	}

	@ExceptionHandler(InvalidCredentialsException.class)
	ProblemDetail handleInvalidCredentials(InvalidCredentialsException exception) {
		return ProblemDetail.forStatusAndDetail(HttpStatus.UNAUTHORIZED, exception.getMessage());
	}

	@ExceptionHandler(InvalidSearchException.class)
	ProblemDetail handleInvalidSearch(InvalidSearchException exception) {
		return ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, exception.getMessage());
	}

	@ExceptionHandler(InvalidGeometryException.class)
	ProblemDetail handleInvalidGeometry(InvalidGeometryException exception) {
		return validationProblem(List.of(new FieldMessage("geometry", exception.getMessage())));
	}

	// Last resort: the cause goes to the log, never to the response body.
	@ExceptionHandler(Exception.class)
	ProblemDetail handleUnexpected(Exception exception) {
		logger.error("Unexpected error", exception);
		return ProblemDetail.forStatusAndDetail(HttpStatus.INTERNAL_SERVER_ERROR, "An unexpected error occurred");
	}

	@Override
	protected ResponseEntity<Object> handleMethodArgumentNotValid(MethodArgumentNotValidException exception,
			HttpHeaders headers, HttpStatusCode status, WebRequest request) {
		List<FieldMessage> errors = exception.getBindingResult().getFieldErrors().stream()
				.map(error -> new FieldMessage(lastSegment(error.getField()), error.getDefaultMessage()))
				.toList();
		return handleExceptionInternal(exception, validationProblem(errors), headers, status, request);
	}

	private static ProblemDetail validationProblem(List<FieldMessage> errors) {
		ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, "Validation failed");
		problem.setProperty("errors", errors);
		return problem;
	}

	// "properties.price" is reported as "price": clients see the form field, not the JSON nesting.
	private static String lastSegment(String path) {
		return path.substring(path.lastIndexOf('.') + 1);
	}

}
