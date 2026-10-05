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

import com.beatriz.landmarketplace.land.InvalidGeometryException;
import com.beatriz.landmarketplace.land.LandOverlapException;

@RestControllerAdvice
public class GlobalExceptionHandler extends ResponseEntityExceptionHandler {

	record FieldMessage(String field, String message) {
	}

	@ExceptionHandler(LandOverlapException.class)
	ProblemDetail handleLandOverlap(LandOverlapException exception) {
		return ProblemDetail.forStatusAndDetail(HttpStatus.CONFLICT, exception.getMessage());
	}

	@ExceptionHandler(InvalidGeometryException.class)
	ProblemDetail handleInvalidGeometry(InvalidGeometryException exception) {
		return validationProblem(List.of(new FieldMessage("geometry", exception.getMessage())));
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
